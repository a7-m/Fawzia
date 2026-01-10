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
  } else if (q.type === "ordering") {
    // Ordering: Drag and Drop
    const list = document.createElement("ul");
    list.className = "space-y-2";
    
    // Initialize standard order if empty, otherwise use saved answer order
    let currentOrder = Array.isArray(answers[currentIndex]) ? answers[currentIndex] : [...(q.items || [])];
    // Shuffle if first time loading and no answer yet (optional, but good for exam)
    if (!answers[currentIndex]) {
        // Simple shuffle for display
        currentOrder = [...(q.items || [])].sort(() => Math.random() - 0.5);
    }

    // Identify visually
    currentOrder.forEach((itemText, i) => {
        const li = document.createElement("li");
        li.className = "p-3 bg-white border border-slate-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-emerald-300 transition flex items-center justify-between shadow-sm select-none";
        li.draggable = !disableInput;
        li.textContent = itemText;
        li.dataset.index = i; // visual index

        if (!disableInput) {
            li.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", i);
                e.dataTransfer.effectAllowed = "move";
                li.classList.add("opacity-50");
            });
            li.addEventListener("dragend", () => {
                li.classList.remove("opacity-50");
            });
            li.addEventListener("dragover", (e) => {
                e.preventDefault(); // allow drop
                li.classList.add("border-emerald-500");
            });
            li.addEventListener("dragleave", () => {
                li.classList.remove("border-emerald-500");
            });
            li.addEventListener("drop", (e) => {
                e.preventDefault();
                li.classList.remove("border-emerald-500");
                const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
                if (fromIndex === i) return;

                // Reorder array
                const movedItem = currentOrder[fromIndex];
                currentOrder.splice(fromIndex, 1);
                currentOrder.splice(i, 0, movedItem);
                
                // Update answer
                answers[currentIndex] = [...currentOrder];
                renderOptions(q); // Re-render to show new order
            });
        }
        list.appendChild(li);
    });
    // Save initial state if null
    if (!answers[currentIndex]) answers[currentIndex] = currentOrder;

    optionsContainer.appendChild(list);
    const hint = document.createElement("p");
    hint.className = "text-xs text-slate-500 mt-2 text-center";
    hint.textContent = "اسحب العناصر ورتبها بالشكل الصحيح.";
    optionsContainer.appendChild(hint);

  } else if (q.type === "matching") {
    // Matching: Side-by-side dropdowns or line drawing approach. 
    // Using dropdowns for simplicity and responsiveness.
    const wrapper = document.createElement("div");
    wrapper.className = "space-y-4";
    
    const rights = q.rightColumn || [];
    const lefts = q.leftColumn || [];
    
    // Initialize answer object: { "rightText": "leftText" }
    const currentMatches = answers[currentIndex] || {};

    rights.forEach((rText, idx) => {
        const row = document.createElement("div");
        row.className = "flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200";
        
        const label = document.createElement("span");
        label.className = "font-medium text-slate-800 w-full sm:w-1/2";
        label.textContent = rText;
        
        const select = document.createElement("select");
        select.className = "w-full sm:w-1/2 p-2 rounded border border-slate-300 focus:border-emerald-500 outline-none bg-white";
        select.disabled = disableInput;
        
        const defOpt = document.createElement("option");
        defOpt.textContent = "اختر الإجابة...";
        defOpt.value = "";
        select.appendChild(defOpt);
        
        lefts.forEach(lText => {
            const opt = document.createElement("option");
            opt.value = lText;
            opt.textContent = lText;
            if (currentMatches[rText] === lText) opt.selected = true;
            select.appendChild(opt);
        });

        select.addEventListener("change", (e) => {
             const val = e.target.value;
             currentMatches[rText] = val;
             answers[currentIndex] = { ...currentMatches };
        });

        row.appendChild(label);
        row.appendChild(select);
        wrapper.appendChild(row);
    });
    optionsContainer.appendChild(wrapper);

  } else if (q.type === "click_drag") { // Using as "Range/Slider" per teacher implementation
    const min = (q.range && q.range[0]) || 0;
    const max = (q.range && q.range[1]) || 10;
    
    const wrapper = document.createElement("div");
    wrapper.className = "py-8 px-4";
    
    const rangeContainer = document.createElement("div");
    rangeContainer.className = "relative flex items-center";

    const input = document.createElement("input");
    input.type = "range";
    input.min = min;
    input.max = max;
    input.className = "w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600";
    input.disabled = disableInput;
    input.value = answers[currentIndex] !== undefined ? answers[currentIndex] : min;

    const valDisplay = document.createElement("span");
    valDisplay.className = "absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-3 py-1 rounded text-sm font-bold shadow-sm transition-all";
    valDisplay.textContent = input.value;
    
    // Position label dynamically
    const updateLabel = () => {
        const percent = ((input.value - min) / (max - min)) * 100;
        valDisplay.style.left = `calc(${percent}% + (${8 - percent * 0.15}px))`;
        valDisplay.textContent = input.value;
    };
    
    // Initial position
    setTimeout(updateLabel, 0);

    input.addEventListener("input", (e) => {
        answers[currentIndex] = Number(e.target.value);
        updateLabel();
    });

    rangeContainer.appendChild(input);
    rangeContainer.appendChild(valDisplay);
    
    const labels = document.createElement("div");
    labels.className = "flex justify-between text-xs text-slate-400 mt-2 font-mono";
    labels.innerHTML = `<span>${min}</span><span>${max}</span>`;
    
    wrapper.appendChild(rangeContainer);
    wrapper.appendChild(labels);
    optionsContainer.appendChild(wrapper);

  } else {
    // Fallback logic kept just in case
    const note = document.createElement("div");
    note.className = "px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm";
    note.textContent = "نوع السؤال غير مدعوم.";
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

function checkAnswer(q, ans) {
  if (ans === null || ans === undefined) return false;
  
  if (["multiple_choice", "dropdown"].includes(q.type)) {
    return Number(ans) === Number(q.correct);
  }
  
  if (q.type === "multiple_select") {
    if (!Array.isArray(ans) || !Array.isArray(q.correct)) return false;
    const sortedAns = [...ans].map(Number).sort((a, b) => a - b);
    const sortedCorr = [...q.correct].map(Number).sort((a, b) => a - b);
    return JSON.stringify(sortedAns) === JSON.stringify(sortedCorr);
  }
  
  if (q.type === "click_drag") {
    return Number(ans) === Number(q.correct);
  }

  if (q.type === "ordering") {
    // Exact order match
    if (!Array.isArray(ans) || !Array.isArray(q.correctOrder)) return false;
    return JSON.stringify(ans) === JSON.stringify(q.correctOrder);
  }

  if (q.type === "matching") {
    // Exact matches object
    if (typeof ans !== "object" || typeof q.correctMatches !== "object") return false;
    // Compare key-values
    const keys = Object.keys(q.correctMatches);
    if (Object.keys(ans).length !== keys.length) return false;
    for (const k of keys) {
        if (ans[k] !== q.correctMatches[k]) return false;
    }
    return true;
  }

  // Essay is manual grading -> always false here (or 'needs review')
  return false; 
}

async function submitExam(user) {
  if (mode === "preview") return;
  
  // Stop timer
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }

  showStatus("جاري تصحيح وإرسال الإجابات...");
  submitExamBtn.disabled = true;
  submitExamBtn.textContent = "جاري الإرسال...";

  // Calculate Score
  let correctCount = 0;
  let incorrectCount = 0;
  
  questions.forEach((q, idx) => {
    // Skip essay for auto-grade count, specific logic needed
    if (q.type === "essay") {
       // Essay is not auto-graded here
       return;
    }
    
    const isCorrect = checkAnswer(q, answers[idx]);
    if (isCorrect) correctCount++;
    else incorrectCount++;
  });

  const totalAutoGradable = questions.filter(q => q.type !== "essay").length;
  const scorePercentage = totalAutoGradable > 0 
    ? Math.round((correctCount / totalAutoGradable) * 100) 
    : 0;
    
  // Time spent
  const timeSpent = (examData.duration ? examData.duration * 60 : 0) - (remainingSeconds || 0);

  try {
    const payload = {
      user_id: user.uid || user.id,
      exam_id: examData.id,
      subject: examData.subject,
      level: examData.title, // using title as level descriptor roughly
      score_percentage: scorePercentage,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      time_spent_seconds: Math.max(timeSpent, 0),
      answers: answers,
      student_name: user.full_name || user.email
    };

    const { error } = await supabase.from("attempts").insert(payload);

    if (error) throw error;

    showStatus(`تم إنهاء الاختبار! درجتك التقريبية: ${scorePercentage}%`, "success");
    setTimeout(() => {
        window.location.href = "student.html#resultsTableBody";
    }, 2000);

  } catch (err) {
    console.error(err);
    showStatus("حدث خطأ أثناء حفظ النتيجة. يرجى المحاولة مرة أخرى.", "error");
    submitExamBtn.disabled = false;
    submitExamBtn.textContent = "إعادة المحاولة";
  }
}

function bindNavigation(user) {
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
        if (confirm("هل أنت متأكد من إنهاء الاختبار وتسليم الإجابة؟")) {
            submitExam(user);
        }
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
  bindNavigation(user);
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
