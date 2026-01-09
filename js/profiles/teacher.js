import { checkAuth, signOut, supabase, roleLanding } from "../auth/auth.js";
import { setStatus, hideStatus, toggle } from "../shared/helpers.js";

const statusEl = document.getElementById("statusMessage");
const classesList = document.getElementById("classesList");
const classesEmpty = document.getElementById("classesEmpty");
const studentsTbody = document.getElementById("studentsTableBody");
const studentsEmpty = document.getElementById("studentsEmpty");
const resultsTbody = document.getElementById("resultsTableBody");
const resultsEmpty = document.getElementById("resultsEmpty");
const logoutBtn = document.getElementById("logoutBtn");

let teacherClasses = [];
let studentsCache = [];

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
    .select("user_id, subject, level, score_percentage, created_at, profile:profiles(id, full_name, class_id, classes!profiles_class_id_fkey(id, name, grade))")
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
    `;
    resultsTbody.appendChild(tr);
  });
}

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
    await loadResults();
  } catch (err) {
    console.error(err);
    setStatus(statusEl, "تعذر تحميل البيانات", "error");
  }
});
