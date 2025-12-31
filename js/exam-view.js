import { supabase, checkAuth } from "./auth.js";

const qs = (id) => document.getElementById(id);
const statusEl = qs("statusMessage");
const actionContainer = qs("actionButtons");

// Exam template elements (teacher engine only)
const examContainer = qs("examContainer");
const modeBadge = qs("modeBadge");
const timerDisplay = qs("timerDisplay");
const progressText = qs("progressText");
const previewHint = qs("previewHint");
const questionText = qs("questionText");
const questionMeta = qs("questionMeta");
const optionsContainer = qs("optionsContainer");
const prevQuestionBtn = qs("prevQuestionBtn");
const nextQuestionBtn = qs("nextQuestionBtn");
const submitExamBtn = qs("submitExamBtn");

let examData = null;
let questions = [];
let answers = [];
let currentIndex = 0;
let mode = "run"; // "run" | "preview"
let timerId = null;
let remainingSeconds = null;

function showStatus(msg, type = "info") {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.classList.remove("hidden");
  statusEl.className =
    "mb-4 px-4 py-3 rounded-xl text-sm font-semibold " +
    (type === "error"
      ? "bg-red-50 text-red-700 border border-red-200"
      : type === "success"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : "bg-slate-50 text-slate-700 border border-slate-200");
}

function hideStatus() {
  if (statusEl) statusEl.classList.add("hidden");
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-EG", { dateStyle: "medium" });
}

function parseQuestions(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("تعذر قراءة الأسئلة.", e);
      return [];
    }
  }
  return [];
}

function normalizeEngine(engine) {
  return engine === "teacher" || engine === "system" ? engine : "teacher";
}

function formatSeconds(sec) {
  if (!Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function renderActions(exam, user) {
  if (!actionContainer) return;
  actionContainer.innerHTML = "";

  const engine = normalizeEngine(exam.engine);

  if (engine !== "teacher") {
    // Respect engine separation: no redirects from teacher engine view
    const note = document.createElement("div");
    note.className =
      "px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm";
    note.textContent =
      "هذا الاختبار تابع لمحرك النظام ويُعرض فقط عبر الصفحة الرئيسية.";
    actionContainer.appendChild(note);
    return;
  }

  const primaryLink = document.createElement("a");
  primaryLink.className =
    "btn px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow";
  primaryLink.textContent = user.isTeacher ? "معاينة" : "بدء الاختبار";
  primaryLink.href = `exam-view.html?exam_id=${exam.id}&mode=${
    user.isTeacher ? "preview" : "run"
  }`;
  actionContainer.appendChild(primaryLink);

  if (user.isTeacher) {
    const attemptsLink = document.createElement("a");
    attemptsLink.href = "./admin.html#resultsTableBody";
    attemptsLink.className =
      "btn-ghost px-4 py-2 text-sm rounded-full border border-slate-200 text-slate-700";
    attemptsLink.textContent = "عرض النتائج";
    actionContainer.appendChild(attemptsLink);
  }
}

function fillExam(exam) {
  qs("examTitle").textContent = exam.title || "اختبار بلا عنوان";
  qs("examSubject").textContent = exam.subject
    ? `المادة: ${exam.subject}`
    : "المادة: —";
  qs("examDuration").textContent = exam.duration
    ? `المدة: ${exam.duration} دقيقة`
    : "المدة: غير محددة";
  qs("examVisibility").textContent =
    exam.visibility === "public" ? "عام" : "خاص";
  qs("examVisibility").className =
    "px-3 py-1 rounded-full text-sm " +
    (exam.visibility === "public"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
      : "bg-amber-50 text-amber-700 border border-amber-100");
  qs("examCreatedAt").textContent = `أُنشئ: ${formatDate(exam.created_at)}`;
  qs("questionsCount").textContent = `${(exam.questions || []).length} سؤال`;
  const passageEl = qs("examPassage");
  if (passageEl) {
    passageEl.innerHTML = exam.passage
      ? exam.passage
      : '<span class="text-slate-400">لا يوجد نص مرفق</span>';
  }
}

function updateModeUI() {
  if (!modeBadge || !submitExamBtn || !previewHint || !timerDisplay) return;
  const isPreview = mode === "preview";
  modeBadge.textContent = isPreview ? "وضع المعاينة" : "وضع الاختبار";
  modeBadge.className =
    "px-3 py-1 rounded-full text-xs border " +
    (isPreview
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : "bg-emerald-50 text-emerald-700 border-emerald-100");
  previewHint.classList.toggle("hidden", !isPreview);
  submitExamBtn.disabled = isPreview;
  submitExamBtn.classList.toggle("opacity-60", isPreview);
  timerDisplay.textContent = isPreview ? "غير مفعّل" : formatSeconds(remainingSeconds);
}

function renderQuestionNav() {
  if (progressText) {
    const total = questions.length;
    progressText.textContent = total
      ? `السؤال ${currentIndex + 1} من ${total}`
      : "لا توجد أسئلة";
  }
  if (prevQuestionBtn) prevQuestionBtn.disabled = currentIndex === 0;
  if (nextQuestionBtn) nextQuestionBtn.disabled = currentIndex >= questions.length - 1;
}

function renderOptions(q) {
  if (!optionsContainer) return;
  optionsContainer.innerHTML = "";
  if (!q) return;

  const disableInput = mode === "preview";

  const addOption = (label, value, type = "radio") => {
    const wrapper = document.createElement("label");
    wrapper.className =
      "flex items-start gap-2 p-3 rounded-lg border border-slate-200 hover:border-emerald-300 transition";
    const input = document.createElement("input");
    input.type = type;
    input.name = `q_${currentIndex}`;
    input.value = value;
    input.disabled = disableInput;
    const isSelected =
      type === "checkbox"
        ? Array.isArray(answers[currentIndex]) &&
          answers[currentIndex].includes(value)
        : answers[currentIndex] === value;
    input.checked = isSelected;
    const text = document.createElement("span");
    text.className = "text-sm text-slate-800";
    text.textContent = label;

    input.addEventListener("change", () => {
      if (type === "checkbox") {
        const existing = Array.isArray(answers[currentIndex])
          ? [...answers[currentIndex]]
          : [];
        if (input.checked) {
          answers[currentIndex] = [...existing, value];
        } else {
          answers[currentIndex] = existing.filter((v) => v !== value);
        }
      } else {
        answers[currentIndex] = value;
      }
    });

    wrapper.appendChild(input);
    wrapper.appendChild(text);
    optionsContainer.appendChild(wrapper);
  };

  if (["multiple_choice", "dropdown"].includes(q.type)) {
    (q.options || []).forEach((opt, idx) => addOption(opt || `اختيار ${idx + 1}`, idx, "radio"));
  } else if (q.type === "multiple_select") {
    (q.options || []).forEach((opt, idx) => addOption(opt || `اختيار ${idx + 1}`, idx, "checkbox"));
  } else if (q.type === "essay") {
    const textarea = document.createElement("textarea");
    textarea.className =
      "w-full min-h-[140px] p-3 border border-slate-200 rounded-lg focus:border-emerald-400 focus:ring-emerald-100";
    textarea.placeholder = "أدخل إجابتك هنا...";
    textarea.disabled = disableInput;
    textarea.value = answers[currentIndex] || "";
    textarea.addEventListener("input", (e) => {
      answers[currentIndex] = e.target.value;
    });
    optionsContainer.appendChild(textarea);
  } else {
    // Fallback for complex types (ordering/matching/click_drag)
    const note = document.createElement("div");
    note.className =
      "px-4 py-3 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-sm text-slate-600";
    note.textContent =
      "يتم عرض هذا السؤال للمعاينة. التفاعل الكامل سيتم دعمه في نسخة قادمة.";
    optionsContainer.appendChild(note);
  }
}

function renderQuestion() {
  const q = questions[currentIndex];
  if (!questionText || !questionMeta) return;

  if (!q) {
    questionText.textContent = "لا توجد أسئلة متاحة لهذا الاختبار.";
    questionMeta.textContent = "";
    optionsContainer.innerHTML = "";
    renderQuestionNav();
    return;
  }

  questionText.textContent = q.q || "سؤال بلا نص";
  const typeMap = {
    multiple_choice: "اختيار من متعدد",
    multiple_select: "اختيار متعدد",
    dropdown: "قائمة منسدلة",
    essay: "إجابة مقالية",
    ordering: "ترتيب",
    matching: "مطابقة",
    click_drag: "سحب وإفلات",
  };
  questionMeta.textContent = `${typeMap[q.type] || "سؤال"} ${
    q.level ? `• المستوى: ${q.level}` : ""
  }`;

  renderOptions(q);
  renderQuestionNav();
}

function startTimerIfNeeded() {
  if (mode === "preview" || !Number.isFinite(remainingSeconds)) {
    if (timerDisplay) timerDisplay.textContent = mode === "preview" ? "غير مفعّل" : "—";
    return;
  }

  const tick = () => {
    remainingSeconds = Math.max(remainingSeconds - 1, 0);
    if (timerDisplay) timerDisplay.textContent = formatSeconds(remainingSeconds);
    if (remainingSeconds <= 0 && timerId) {
      clearInterval(timerId);
      timerId = null;
      if (submitExamBtn && !submitExamBtn.disabled) {
        submitExamBtn.click();
      }
    }
  };

  if (timerDisplay) timerDisplay.textContent = formatSeconds(remainingSeconds);
  timerId = setInterval(tick, 1000);
}

function bindNavigation() {
  if (prevQuestionBtn) {
    prevQuestionBtn.addEventListener("click", () => {
      if (currentIndex > 0) {
        currentIndex--;
        renderQuestion();
      }
    });
  }
  if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener("click", () => {
      if (currentIndex < questions.length - 1) {
        currentIndex++;
        renderQuestion();
      }
    });
  }
  if (submitExamBtn) {
    submitExamBtn.addEventListener("click", () => {
      if (mode === "preview") return;
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      alert("تم إرسال إجاباتك. (حفظ النتائج سيضاف لاحقاً)");
    });
  }
}

async function loadExam(examId, user) {
  showStatus("جاري تحميل تفاصيل الاختبار...");
  const { data, error } = await supabase
    .from("exams")
    .select("id, title, subject, duration, visibility, created_at, questions, passage, engine")
    .eq("id", examId)
    .single();

  if (error || !data) {
    console.error(error);
    showStatus("تعذر تحميل الاختبار.", "error");
    return;
  }

  examData = { ...data, engine: normalizeEngine(data.engine) };
  questions = parseQuestions(examData.questions);
  answers = new Array(questions.length).fill(null);
  remainingSeconds = Number.isFinite(examData.duration) ? examData.duration * 60 : null;

  hideStatus();
  fillExam(examData);
  renderActions(examData, user);

  if (examData.engine !== "teacher") {
    if (examContainer) examContainer.classList.add("hidden");
    showStatus("هذا الاختبار مخصص لمحرك النظام ولا يمكن تشغيله هنا.", "error");
    return;
  }

  if (examContainer) examContainer.classList.remove("hidden");
  updateModeUI();
  bindNavigation();
  renderQuestion();
  startTimerIfNeeded();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await checkAuth({ protected: true });
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const examId = params.get("exam_id");
    mode = params.get("mode") === "preview" ? "preview" : "run";

    if (!examId) {
      showStatus("معرّف الاختبار مفقود في الرابط.", "error");
      return;
    }

    await loadExam(examId, user);
  } catch (err) {
    console.error(err);
    showStatus("حدث خطأ غير متوقع.", "error");
  }
});
