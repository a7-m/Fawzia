import { supabase, checkAuth, getCurrentUser } from "./auth.js";

// Helpers
const qs = (id) => document.getElementById(id);
const statusMessage = qs("statusMessage");
const resultContent = qs("resultContent");

function showStatus(msg, type = "info") {
  if (!statusMessage) return;
  statusMessage.textContent = msg;
  statusMessage.classList.remove("hidden");
  statusMessage.className =
    "mb-6 px-4 py-3 rounded-xl text-sm font-semibold " +
    (type === "error"
      ? "bg-red-50 text-red-700 border border-red-200"
      : type === "success"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : "bg-slate-50 text-slate-700 border border-slate-200");
}

function hideStatus() {
  if (!statusMessage) return;
  statusMessage.classList.add("hidden");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return `${secs} ثانية`;
  return `${mins} دقيقة ${secs > 0 ? `${secs} ثانية` : ""}`.trim();
}

function buildShareLink(attemptId) {
  const url = new URL(window.location.href);
  url.searchParams.set("attempt_id", attemptId);
  return url.toString();
}

function setProgress(percent) {
  const bar = qs("progressBar");
  const label = qs("progressLabel");
  if (bar) bar.style.width = `${percent}%`;
  if (label) label.textContent = `${percent.toFixed(1)}%`;
}

function renderQuestions(questions, attemptAnswers = []) {
  const container = qs("questionsContainer");
  if (!container) return;
  container.innerHTML = "";

  questions.forEach((q, idx) => {
    const studentAnswer = attemptAnswers[idx];
    const correctAnswer = q.correct ?? q.correctAnswer ?? null;
    const isCorrect =
      studentAnswer !== undefined && correctAnswer !== undefined
        ? JSON.stringify(studentAnswer) === JSON.stringify(correctAnswer)
        : null;

    const item = document.createElement("article");
    item.className =
      "review-item " +
      (isCorrect === true ? "correct" : isCorrect === false ? "incorrect" : "");

    const questionType = q.type || "غير محدد";
    const cognitive = q.level || "غير محدد";

    // Normalize answers for display
    const pretty = (val) => {
      if (val === null || val === undefined) return "لم يُجب";
      if (Array.isArray(val)) return val.join(" | ");
      if (typeof val === "object") {
        return Object.entries(val)
          .map(([k, v]) => `${k} → ${v}`)
          .join(" | ");
      }
      return String(val);
    };

    item.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="review-question text-lg mb-2">س${idx + 1}. ${q.q || "-"}</p>
          <div class="flex flex-wrap gap-2 text-xs text-slate-500 mb-2">
            <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700">النوع: ${questionType}</span>
            <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700">المستوى المعرفي: ${cognitive}</span>
          </div>
          <p class="review-answer user-answer">إجابة الطالب: ${pretty(studentAnswer)}</p>
          <p class="review-answer correct-answer">الإجابة الصحيحة: ${pretty(correctAnswer)}</p>
          <p class="review-answer text-slate-500">ملاحظات المعلم: <span class="text-slate-700 font-medium">—</span></p>
        </div>
        <div class="text-sm font-bold ${isCorrect === true ? "text-emerald-600" : isCorrect === false ? "text-red-500" : "text-slate-400"}">
          ${isCorrect === true ? "صحيح" : isCorrect === false ? "خطأ" : "غير محدد"}
        </div>
      </div>
    `;

    container.appendChild(item);
  });
}

async function fetchResult(attemptId, currentUser) {
  // Fetch attempt
  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .select(
      "id, user_id, exam_id, subject, level, score_percentage, correct_count, incorrect_count, time_spent_seconds, created_at, answers, student_name"
    )
    .eq("id", attemptId)
    .single();

  if (attemptError || !attempt) {
    throw new Error("تعذر تحميل المحاولة أو غير موجودة.");
  }

  // Basic authorization (RLS already enforces; this is UX guard)
  if (!currentUser.isTeacher && attempt.user_id !== currentUser.uid) {
    throw new Error("غير مسموح لك بعرض هذه النتيجة.");
  }

  // Fetch exam
  let exam = null;
  if (attempt.exam_id) {
    const { data: examData } = await supabase
      .from("exams")
      .select("title, subject, passage, duration, created_at, author_id, questions")
      .eq("id", attempt.exam_id)
      .single();
    exam = examData || null;
  }

  // Fetch profile (if permitted)
  let profile = null;
  if (attempt.user_id) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("name, class, student_number")
      .eq("id", attempt.user_id)
      .single();
    profile = profileData || null;
  }

  return { attempt, exam, profile };
}

function fillExamSection(exam, attempt) {
  const titleEl = qs("examTitle");
  if (titleEl) titleEl.textContent = exam?.title || attempt.subject || "-";
  
  const subjectEl = qs("examSubject");
  if (subjectEl) subjectEl.textContent = exam?.subject || attempt.subject || "-";
  
  const durationEl = qs("examDuration");
  if (durationEl) {
    durationEl.textContent =
      exam?.duration !== undefined && exam?.duration !== null
        ? `${exam.duration} دقيقة`
        : "-";
  }
  
  const createdEl = qs("examCreatedAt");
  if (createdEl) createdEl.textContent = formatDate(exam?.created_at);
  
  const teacherEl = qs("teacherName");
  if (teacherEl) teacherEl.textContent = exam?.author_name || "—";
  
  const passageEl = qs("examPassage");
  if (passageEl) {
    passageEl.innerHTML = exam?.passage
      ? exam.passage
      : '<span class="text-slate-400">لا يوجد نص مرفق</span>';
  }
}

function fillStudentSection(profile, attempt) {
  const nameEl = qs("studentName");
  if (nameEl) nameEl.textContent = profile?.name || attempt.student_name || "—";
  
  const classEl = qs("studentClass");
  if (classEl) classEl.textContent = profile?.class || "—";
  
  const numberEl = qs("studentNumber");
  if (numberEl) numberEl.textContent = profile?.student_number || "—";
  
  const dateEl = qs("attemptDate");
  if (dateEl) dateEl.textContent = formatDate(attempt.created_at);
  
  const timeEl = qs("timeSpent");
  if (timeEl) timeEl.textContent = formatDuration(attempt.time_spent_seconds);
}

function fillSummary(attempt, examQuestions = []) {
  const total = attempt.correct_count + attempt.incorrect_count;
  const percent =
    typeof attempt.score_percentage === "number"
      ? attempt.score_percentage
      : total > 0
      ? (attempt.correct_count / total) * 100
      : 0;

  const scoreEl = qs("scorePercent");
  if (scoreEl) scoreEl.textContent = percent ? `${percent.toFixed(1)}%` : "-";
  
  const correctEl = qs("correctCount");
  if (correctEl) correctEl.textContent = attempt.correct_count ?? "-";
  
  const incorrectEl = qs("incorrectCount");
  if (incorrectEl) incorrectEl.textContent = attempt.incorrect_count ?? "-";
  
  const totalEl = qs("totalQuestions");
  if (totalEl) totalEl.textContent = total || examQuestions.length || "-";
  
  const durationInfoEl = qs("durationInfo");
  if (durationInfoEl) {
    durationInfoEl.textContent =
      examQuestions.length && attempt.time_spent_seconds
        ? formatDuration(attempt.time_spent_seconds)
        : "-";
  }

  const efficiency =
    attempt.time_spent_seconds && total
      ? attempt.time_spent_seconds / total
      : null;
  const timeBadge = qs("timeEfficiency");
  if (timeBadge) {
    if (efficiency) {
      timeBadge.textContent = `متوسط ${efficiency.toFixed(1)} ث لكل سؤال`;
      timeBadge.classList.remove("hidden");
    } else {
      timeBadge.textContent = "";
      timeBadge.classList.add("hidden");
    }
  }
  setProgress(Math.min(Math.max(percent, 0), 100));
}

function setupSharing(attemptId) {
  const link = buildShareLink(attemptId);
  const shareInput = qs("shareLink");
  if (shareInput) shareInput.value = link;

  const copyButtons = [qs("copyLinkBtn"), qs("copyLinkBtnBottom")].filter(Boolean);
  copyButtons.forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(link);
        showStatus("تم نسخ الرابط بنجاح.", "success");
      } catch (err) {
        showStatus("تعذر نسخ الرابط. انسخه يدويًا.", "error");
      }
    })
  );

  const waButtons = [qs("whatsAppBtn"), qs("whatsAppBtnBottom")].filter(Boolean);
  waButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      const text = encodeURIComponent("تقرير نتيجتي في الاختبار: ");
      const url = encodeURIComponent(link);
      window.open(`https://wa.me/?text=${text}${url}`, "_blank");
    })
  );
}

function setupPrint() {
  const btn = qs("printBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    window.print();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await checkAuth({ protected: true }); // ensures session
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const attemptId = params.get("attempt_id");
    if (!attemptId) {
      showStatus("رقم المحاولة غير موجود في الرابط.", "error");
      return;
    }

    showStatus("جاري تحميل البيانات ...", "info");
    const { attempt, exam, profile } = await fetchResult(attemptId, user);

    fillExamSection(exam, attempt);
    fillStudentSection(profile, attempt);
    fillSummary(attempt, exam?.questions || []);
    renderQuestions(exam?.questions || [], attempt.answers || []);

    hideStatus();
    resultContent?.classList.remove("hidden");

    setupSharing(attemptId);
    setupPrint();
  } catch (err) {
    console.error(err);
    showStatus(err.message || "حدث خطأ غير متوقع", "error");
  }
});

// Printing: CSS @media print hides controls; button triggers window.print().
// Sharing: build link from attempt_id query param, copy via Clipboard API, and open WhatsApp URL with encoded text.
