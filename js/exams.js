import { supabase, checkAuth } from "./auth.js";

const qs = (id) => document.getElementById(id);
const listEl = qs("examsList");
const statusEl = qs("statusMessage");

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

function persistExamToLocal(exam) {
  const key = "pirlsTestState";
  const prev = (() => {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch {
      return {};
    }
  })();

  const base = {
    subject: exam.subject || prev.subject || "لغة عربية",
    level: exam.title,
    duration: Number.isFinite(exam.duration) ? exam.duration : prev.duration || 0,
    questions: parseQuestions(exam.questions),
    passage: exam.passage || null,
    examId: exam.id,
    studentName: prev.studentName || "",
    gradeLevel: prev.gradeLevel || "",
    recipientEmail: prev.recipientEmail || "",
    answers: [],
    currentQuestion: 0,
    startTime: null,
    timerInterval: null,
    scorePercentage: null,
    correctCount: 0,
    incorrectCount: 0,
    timeSpentSeconds: 0,
    remainingSeconds: exam.duration ? exam.duration * 60 : null,
    isCompleted: false,
    lastVisitedPage: "home",
  };

  localStorage.setItem(key, JSON.stringify(base));
}

function normalizeEngine(engine) {
  return engine === "system" || engine === "teacher" ? engine : "teacher";
}

function renderExams(exams, user) {
  if (!listEl) return;
  listEl.innerHTML = "";

  if (!exams || exams.length === 0) {
    const empty = document.createElement("div");
    empty.className =
      "info-card text-center text-slate-500 bg-white border border-dashed border-slate-200 py-10";
    empty.textContent = "لا توجد اختبارات متاحة حالياً.";
    listEl.appendChild(empty);
    return;
  }

  exams.forEach((exam) => {
    const engine = normalizeEngine(exam.engine);
    const examData = { ...exam, engine };

    const card = document.createElement("article");
    card.className =
      "info-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between";

    const info = document.createElement("div");
    info.innerHTML = `
      <h2 class="text-xl font-bold text-slate-900">${exam.title || "اختبار بلا عنوان"}</h2>
      <div class="flex flex-wrap items-center gap-2 text-sm text-slate-600 mt-1">
        <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700">المادة: ${
          exam.subject || "—"
        }</span>
        <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700">المدة: ${
          exam.duration ? `${exam.duration} دقيقة` : "غير محددة"
        }</span>
        <span class="px-3 py-1 rounded-full ${
          exam.visibility === "public"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
            : "bg-amber-50 text-amber-700 border border-amber-100"
        }">
          ${exam.visibility === "public" ? "عام" : "خاص"}
        </span>
        <span class="text-xs text-slate-500">أُنشئ: ${formatDate(exam.created_at)}</span>
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "flex flex-wrap gap-2";

    const viewBtn = document.createElement("a");
    viewBtn.className =
      "btn-ghost px-4 py-2 rounded-full text-sm font-semibold border border-slate-200 text-slate-700";
    viewBtn.textContent = user.isTeacher ? "معاينة" : "عرض التفاصيل";
    if (engine === "teacher") {
      viewBtn.href = `./exam-view.html?exam_id=${exam.id}&mode=preview`;
    } else {
      viewBtn.href = "../index.html#homePage";
      viewBtn.addEventListener("click", (e) => {
        e.preventDefault();
        persistExamToLocal(examData);
        window.location.href = "../index.html#homePage";
      });
    }

    const startBtn = document.createElement(engine === "teacher" ? "a" : "button");
    startBtn.className =
      "btn px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow";
    startBtn.textContent = (user.isTeacher || user.isAdmin) ? "معاينة الاختبار" : "بدء الاختبار";
    if (engine === "teacher") {
      startBtn.href = `./exam-view.html?exam_id=${exam.id}&mode=${
        (user.isTeacher || user.isAdmin) ? "preview" : "run"
      }`;
    } else {
      startBtn.addEventListener("click", () => {
        persistExamToLocal(examData);
        window.location.href = "../index.html#homePage";
      });
    }

    actions.appendChild(startBtn);

    // Edit Button for Teachers/Admins
    if (user.isTeacher || user.isAdmin) {
       const editBtn = document.createElement("a");
       editBtn.className = "btn-ghost px-4 py-2 rounded-full text-sm font-semibold border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-200";
       editBtn.textContent = "تعديل";
       editBtn.href = `./create-exam.html?exam_id=${exam.id}`;
       actions.appendChild(editBtn);
    } else {
       // Only show View Details for students if not a teacher engine (or if we want them to see details)
       actions.appendChild(viewBtn);
    }
    
    if (user.isTeacher || user.isAdmin) {
       // Results link...
       const resultsLink = document.createElement("a");
       resultsLink.href = "./admin.html#resultsTableBody";
       resultsLink.className = "btn-ghost px-4 py-2 text-sm rounded-full border border-slate-200 text-slate-700";
       resultsLink.textContent = "عرض النتائج";
       actions.appendChild(resultsLink);
    }

    card.appendChild(info);
    card.appendChild(actions);
    listEl.appendChild(card);
  });
}

async function loadExams(user) {
  showStatus("جاري تحميل الاختبارات...");

  let query = supabase
    .from("exams")
    .select("id, title, subject, duration, visibility, created_at, questions, passage, engine")
    .order("created_at", { ascending: false });

  if (!user.isTeacher) {
    query = query.eq("visibility", "public");
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    showStatus("تعذر تحميل الاختبارات. حاول مرة أخرى.", "error");
    return;
  }

  hideStatus();
  renderExams(data || [], user);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await checkAuth({ protected: true });
    if (!user) return;
    await loadExams(user);
  } catch (err) {
    console.error(err);
    showStatus("حدث خطأ غير متوقع.", "error");
  }
});
