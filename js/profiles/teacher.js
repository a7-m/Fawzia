import { checkAuth, signOut, supabase, roleLanding } from "../auth/auth.js";
import { setStatus, hideStatus, toggle } from "../shared/helpers.js";

const statusEl = document.getElementById("statusMessage");
const classesList = document.getElementById("classesList");
const classesEmpty = document.getElementById("classesEmpty");
const studentsTbody = document.getElementById("studentsTableBody");
const studentsEmpty = document.getElementById("studentsEmpty");
const resultsTbody = document.getElementById("resultsTableBody");
const resultsEmpty = document.getElementById("resultsEmpty");
const myExamsTbody = document.getElementById("myExamsTableBody");
const myExamsEmpty = document.getElementById("myExamsEmpty");
const logoutBtn = document.getElementById("logoutBtn");

let teacherClasses = [];
let studentsCache = [];
let teacherExams = [];

function renderClasses() {
  if (!classesList) return;
  classesList.innerHTML = "";
  toggle(classesEmpty, teacherClasses.length === 0);
  teacherClasses.forEach((c) => {
    const pill = document.createElement("span");
    pill.className = "inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 text-slate-700";
    pill.textContent = `${c.name}${c.grade ? ` • الصف ${c.grade}` : ""}`;
    classesList.appendChild(pill);
  });
}

async function loadClasses(teacherId) {
  const { data, error } = await supabase
    .from("teacher_classes")
    .select("class_id, classes(id, name, grade)")
    .eq("teacher_id", teacherId);
  if (error) throw error;
  teacherClasses = (data || []).map((r) => r.classes).filter(Boolean);
  renderClasses();
}

async function loadStudents() {
  if (teacherClasses.length === 0) {
    studentsCache = [];
    renderStudents();
    return;
  }
  const classIds = teacherClasses.map((c) => c.id);
  const { data, error } = await supabase
    .from("student_classes")
    .select("student:student_id(id, full_name, email, class_id, classes!profiles_class_id_fkey(id, name, grade))")
    .in("class_id", classIds);
  if (error) throw error;
  studentsCache = (data || []).map((r) => r.student).filter(Boolean);
  renderStudents();
}

function renderStudents() {
  if (!studentsTbody) return;
  studentsTbody.innerHTML = "";
  toggle(studentsEmpty, studentsCache.length === 0);
  studentsCache.forEach((s) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-3 py-2">${s.full_name || s.email || "-"}</td>
      <td class="px-3 py-2">${s.classes ? `${s.classes.name}${s.classes.grade ? ` (الصف ${s.classes.grade})` : ""}` : "-"}</td>
      <td class="px-3 py-2">${s.email || "-"}</td>
    `;
    studentsTbody.appendChild(tr);
  });
}

async function loadResults() {
  if (!resultsTbody) return;
  resultsTbody.innerHTML = "";
  const studentIds = studentsCache.map((s) => s.id);
  if (studentIds.length === 0) {
    toggle(resultsEmpty, true);
    return;
  }
  const { data, error } = await supabase
    .from("attempts")
    .select("id, user_id, subject, level, score_percentage, created_at, profile:profiles(id, full_name, class_id, classes!profiles_class_id_fkey(id, name, grade))")
    .in("user_id", studentIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  toggle(resultsEmpty, !data || data.length === 0);
  (data || []).forEach((a, idx) => {
    const cls = a.profile?.classes;
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-3 py-2">${a.profile?.full_name || `محاولة ${idx + 1}`}</td>
      <td class="px-3 py-2">${cls ? `${cls.name}${cls.grade ? ` (الصف ${cls.grade})` : ""}` : "-"}</td>
      <td class="px-3 py-2">${typeof a.score_percentage === "number" ? a.score_percentage + "%" : "-"}</td>
      <td class="px-3 py-2">${a.created_at ? new Date(a.created_at).toLocaleString("ar-EG") : "-"}</td>
      <td class="px-3 py-2">
         <a href="result-view.html?attempt_id=${a.user_id ? a.id : "#"}" class="btn-ghost px-3 py-1 text-xs rounded border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200">
           تفاصيل
         </a>
      </td>
    `;
    resultsTbody.appendChild(tr);
  });
}

async function loadExams(teacherId) {
  if (!myExamsTbody) return;
  const { data, error } = await supabase
    .from("exams")
    .select("id, title, subject, visibility, created_at")
    .eq("author_id", teacherId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  teacherExams = data || [];
  renderExams();
}

function renderExams() {
  if (!myExamsTbody) return;
  myExamsTbody.innerHTML = "";
  toggle(myExamsEmpty, teacherExams.length === 0);
  teacherExams.forEach((exam) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-3 py-2 font-medium">${exam.title}</td>
      <td class="px-3 py-2">${exam.subject || "-"}</td>
      <td class="px-3 py-2">
        <span class="px-2 py-1 rounded text-xs ${exam.visibility === "public" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}">
          ${exam.visibility === "public" ? "عام" : "خاص"}
        </span>
      </td>
      <td class="px-3 py-2 space-x-2 space-x-reverse">
        <a href="create-exam.html?exam_id=${exam.id}" class="btn-ghost px-2 py-1 text-xs rounded border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition">تعديل</a>
        <button onclick="confirmDeleteExam(${exam.id})" class="btn-ghost px-2 py-1 text-xs rounded border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition">حذف</button>
      </td>
    `;
    myExamsTbody.appendChild(tr);
  });
}

window.confirmDeleteExam = async (examId) => {
  if (!confirm("هل أنت متأكد من حذف هذا الاختبار؟ لا يمكن التراجع عن هذا الإجراء.")) return;
  try {
    const { error } = await supabase.from("exams").delete().eq("id", examId);
    if (error) throw error;
    teacherExams = teacherExams.filter(e => e.id !== examId);
    renderExams();
    setStatus(statusEl, "تم حذف الاختبار بنجاح ✅", "success");
  } catch (err) {
    console.error(err);
    setStatus(statusEl, "تعذر حذف الاختبار", "error");
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await checkAuth({ protected: true });
    if (!user) return;
    if (user.role !== "teacher") {
      window.location.replace(roleLanding(user.role));
      return;
    }

    document.getElementById("teacherName").textContent = user.name || user.email || "معلم";
    document.getElementById("teacherEmail").textContent = user.email || "";
    if (logoutBtn) logoutBtn.addEventListener("click", () => signOut());

    await loadClasses(user.uid);
    await loadStudents();
    await loadExams(user.uid);
    await loadResults();
    
    // Pre-fill name
    const nameInput = document.getElementById("nameInput");
    if (nameInput) nameInput.value = user.name || "";

    const formEl = document.getElementById("profileForm");
    if (formEl) {
      formEl.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newName = nameInput.value.trim();
        if (!newName) return;
        
        try {
          hideStatus();
          const { error } = await supabase.from("profiles").update({ full_name: newName }).eq("id", user.uid);
          if (error) throw error;
          
          setStatus(statusEl, "تم حفظ الاسم بنجاح ✅", "success");
          document.getElementById("teacherName").textContent = newName;
          user.name = newName;
        } catch (err) {
          console.error(err);
          setStatus(statusEl, "تعذر حفظ التعديلات", "error");
        }
      });
    }

  } catch (err) {
    console.error(err);
    setStatus(statusEl, "تعذر تحميل البيانات", "error");
  }
});
