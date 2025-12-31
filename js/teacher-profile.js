import { checkAuth, signOut, supabase, roleLanding } from "./auth.js";

const statusEl = document.getElementById("statusMessage");
const studentsTbody = document.getElementById("studentsTableBody");
const studentsEmpty = document.getElementById("studentsEmpty");
const resultsTbody = document.getElementById("resultsTableBody");
const resultsEmpty = document.getElementById("resultsEmpty");
let studentsCache = [];

function showStatus(message, type = "success") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className =
    "rounded-xl border px-4 py-3 text-sm font-semibold " +
    (type === "error"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-emerald-50 border-emerald-200 text-emerald-700");
  statusEl.classList.remove("hidden");
}

function hideStatus() {
  if (statusEl) statusEl.classList.add("hidden");
}

function toggleEmpty(el, show) {
  if (!el) return;
  el.classList.toggle("hidden", !show);
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await checkAuth({ protected: true });
  if (!user) return;
  if (user.role !== "teacher") {
    window.location.replace(roleLanding(user.role));
    return;
  }

  document.getElementById("teacherName").textContent = user.name || user.email || "معلم";
  document.getElementById("teacherEmail").textContent = user.email || "";

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => signOut());

  await loadStudents(user.uid);
  await loadResults();
  bindStudentActions();
});

async function loadStudents(teacherId) {
  if (!studentsTbody) return;
  studentsTbody.innerHTML = "";

  const { data, error } = await supabase
    .from("teacher_students")
    .select("student:profiles(id,name,class,student_number)")
    .eq("teacher_id", teacherId);

  if (error) {
    console.error(error);
    showStatus("تعذر تحميل الطلاب", "error");
    toggleEmpty(studentsEmpty, true);
    return;
  }

  studentsCache = (data || []).map((row) => row.student).filter(Boolean);
  toggleEmpty(studentsEmpty, studentsCache.length === 0);

  studentsCache.forEach((s) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.dataset.sid = s.id;
    tr.innerHTML = `
      <td class="px-3 py-2">
        <input data-field="name" class="w-full border rounded px-2 py-1 text-sm" value="${s.name || ""}" placeholder="الاسم" />
      </td>
      <td class="px-3 py-2">
        <input data-field="class" class="w-full border rounded px-2 py-1 text-sm" value="${s.class || ""}" placeholder="الصف" />
      </td>
      <td class="px-3 py-2">
        <input data-field="student_number" class="w-full border rounded px-2 py-1 text-sm" value="${s.student_number || ""}" placeholder="الرقم" />
      </td>
      <td class="px-3 py-2">
        <button class="save-student btn btn-sm" type="button">حفظ</button>
      </td>
    `;
    studentsTbody.appendChild(tr);
  });
}

function bindStudentActions() {
  if (!studentsTbody) return;
  studentsTbody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".save-student");
    if (!btn) return;
    const row = btn.closest("tr");
    const sid = row?.dataset.sid;
    if (!sid) return;

    const payload = {};
    row.querySelectorAll("[data-field]").forEach((input) => {
      const key = input.dataset.field;
      const val = input.value?.trim();
      payload[key] = val === "" ? null : val;
    });

    try {
      hideStatus();
      const { error } = await supabase.from("profiles").update(payload).eq("id", sid);
      if (error) throw error;
      showStatus("تم حفظ التعديلات بنجاح ✅", "success");
    } catch (err) {
      console.error(err);
      showStatus("تعذر حفظ التعديلات", "error");
    }
  });
}

async function loadResults() {
  if (!resultsTbody) return;
  resultsTbody.innerHTML = "";

  const studentIds = studentsCache.map((s) => s.id);
  if (studentIds.length === 0) {
    toggleEmpty(resultsEmpty, true);
    return;
  }

  const { data, error } = await supabase
    .from("attempts")
    .select("user_id, score_percentage, created_at")
    .in("user_id", studentIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showStatus("تعذر تحميل النتائج", "error");
    toggleEmpty(resultsEmpty, true);
    return;
  }

  toggleEmpty(resultsEmpty, !data || data.length === 0);
  const map = new Map(studentsCache.map((s) => [s.id, s]));

  (data || []).forEach((a, idx) => {
    const student = map.get(a.user_id) || {};
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-3 py-2">${student.name || `محاولة ${idx + 1}`}</td>
      <td class="px-3 py-2">${student.class || "-"}</td>
      <td class="px-3 py-2">${student.student_number || "-"}</td>
      <td class="px-3 py-2">${typeof a.score_percentage === "number" ? a.score_percentage + "%" : "-"}</td>
      <td class="px-3 py-2">${a.created_at ? new Date(a.created_at).toLocaleString("ar-EG") : "-"}</td>
    `;
    resultsTbody.appendChild(tr);
  });
}
