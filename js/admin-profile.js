import { checkAuth, signOut, supabase, roleLanding } from "./auth.js";

const statusEl = document.getElementById("statusMessage");
const usersTbody = document.getElementById("usersTableBody");
const usersEmpty = document.getElementById("usersEmpty");
const linksTbody = document.getElementById("linksTableBody");
const linksEmpty = document.getElementById("linksEmpty");
const resultsTbody = document.getElementById("resultsTableBody");
const resultsEmpty = document.getElementById("resultsEmpty");
const teacherSelect = document.getElementById("teacherSelect");
const studentsMulti = document.getElementById("studentsMulti");

let teachersCache = [];
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

function toggleEmpty(el, shouldShow) {
  if (!el) return;
  el.classList.toggle("hidden", !shouldShow);
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await checkAuth({ protected: true, adminOnly: true });
  if (!user) return;

  document.getElementById("adminName").textContent = user.name || user.email || "مشرف";
  document.getElementById("adminEmail").textContent = user.email || "";

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => signOut());

  await Promise.all([loadUsersTable(), loadTeacherData(), loadResultsTable()]);

  bindUsersActions();
  bindAssignmentActions();
});

async function loadUsersTable() {
  if (!usersTbody) return;
  usersTbody.innerHTML = "";
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id,email,role,name,class,student_number")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showStatus("تعذر تحميل المستخدمين", "error");
    toggleEmpty(usersEmpty, true);
    return;
  }

  toggleEmpty(usersEmpty, !users || users.length === 0);

  (users || []).forEach((u) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.dataset.uid = u.id;
    tr.innerHTML = `
      <td class="px-3 py-2">
        <input data-field="name" class="w-full border rounded px-2 py-1 text-sm" value="${u.name || ""}" placeholder="الاسم" />
      </td>
      <td class="px-3 py-2 text-slate-600">${u.email || "-"}</td>
      <td class="px-3 py-2">
        <select data-field="role" class="border rounded px-2 py-1 text-sm bg-white">
          <option value="admin" ${u.role === "admin" ? "selected" : ""}>admin</option>
          <option value="teacher" ${u.role === "teacher" ? "selected" : ""}>teacher</option>
          <option value="student" ${u.role === "student" ? "selected" : ""}>student</option>
        </select>
      </td>
      <td class="px-3 py-2">
        <input data-field="class" class="w-full border rounded px-2 py-1 text-sm" value="${u.class || ""}" placeholder="الصف" />
      </td>
      <td class="px-3 py-2">
        <input data-field="student_number" class="w-full border rounded px-2 py-1 text-sm" value="${u.student_number || ""}" placeholder="الرقم" />
      </td>
      <td class="px-3 py-2">
        <button class="save-user btn btn-sm" type="button">حفظ</button>
      </td>
    `;
    usersTbody.appendChild(tr);
  });
}

function bindUsersActions() {
  if (!usersTbody) return;
  usersTbody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".save-user");
    if (!btn) return;
    const row = btn.closest("tr");
    const uid = row?.dataset.uid;
    if (!uid) return;

    const payload = {};
    row.querySelectorAll("[data-field]").forEach((input) => {
      const key = input.dataset.field;
      const val = input.value?.trim();
      payload[key] = val === "" ? null : val;
    });

    try {
      hideStatus();
      const { error } = await supabase.from("profiles").update(payload).eq("id", uid);
      if (error) throw error;
      showStatus("تم حفظ التعديلات بنجاح ✅", "success");
    } catch (err) {
      console.error(err);
      showStatus("تعذر حفظ التعديلات. حاول مرة أخرى.", "error");
    }
  });
}

async function loadTeacherData() {
  await Promise.all([loadTeachers(), loadStudents()]);
  await loadTeacherStudentLinks();
}

async function loadTeachers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("role", "teacher")
    .order("name", { ascending: true });
  if (error) {
    console.error(error);
    showStatus("تعذر تحميل المعلمين", "error");
    return;
  }
  teachersCache = data || [];
  if (teacherSelect) {
    teacherSelect.innerHTML = "";
    teachersCache.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name || t.email || "معلم";
      teacherSelect.appendChild(opt);
    });
  }
}

async function loadStudents() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, class, student_number")
    .eq("role", "student")
    .order("name", { ascending: true });
  if (error) {
    console.error(error);
    showStatus("تعذر تحميل الطلاب", "error");
    return;
  }
  studentsCache = data || [];
  if (studentsMulti) {
    studentsMulti.innerHTML = "";
    studentsCache.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name || s.student_number || "طالب";
      studentsMulti.appendChild(opt);
    });
  }
}

async function loadTeacherStudentLinks() {
  if (!linksTbody) return;
  linksTbody.innerHTML = "";

  const { data, error } = await supabase
    .from("teacher_students")
    .select("teacher_id, student_id");

  if (error) {
    console.error(error);
    showStatus("تعذر تحميل الروابط", "error");
    toggleEmpty(linksEmpty, true);
    return;
  }

  const teacherMap = new Map(teachersCache.map((t) => [t.id, t]));
  const studentMap = new Map(studentsCache.map((s) => [s.id, s]));

  toggleEmpty(linksEmpty, !data || data.length === 0);

  (data || []).forEach((link) => {
    const teacher = teacherMap.get(link.teacher_id) || {};
    const student = studentMap.get(link.student_id) || {};
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.dataset.teacherId = link.teacher_id;
    tr.dataset.studentId = link.student_id;
    tr.innerHTML = `
      <td class="px-3 py-2">${teacher.name || teacher.email || "-"}</td>
      <td class="px-3 py-2">${student.name || "-"}</td>
      <td class="px-3 py-2">${student.class || "-"}</td>
      <td class="px-3 py-2">${student.student_number || "-"}</td>
      <td class="px-3 py-2">
        <button class="remove-link btn btn-sm btn-ghost" type="button">حذف</button>
      </td>
    `;
    linksTbody.appendChild(tr);
  });

  linksTbody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".remove-link");
    if (!btn) return;
    const row = btn.closest("tr");
    const teacherId = row?.dataset.teacherId;
    const studentId = row?.dataset.studentId;
    if (!teacherId || !studentId) return;
    try {
      hideStatus();
      const { error: delErr } = await supabase
        .from("teacher_students")
        .delete()
        .match({ teacher_id: teacherId, student_id: studentId });
      if (delErr) throw delErr;
      showStatus("تم حذف الرابط", "success");
      await loadTeacherStudentLinks();
    } catch (err) {
      console.error(err);
      showStatus("تعذر حذف الرابط", "error");
    }
  });
}

function bindAssignmentActions() {
  const assignBtn = document.getElementById("assignBtn");
  const refreshBtn = document.getElementById("refreshLinks");

  if (assignBtn) {
    assignBtn.addEventListener("click", async () => {
      if (!teacherSelect || !studentsMulti) return;
      const teacherId = teacherSelect.value;
      const selectedStudents = Array.from(studentsMulti.selectedOptions).map((o) => o.value);
      if (!teacherId || selectedStudents.length === 0) {
        showStatus("اختر معلماً وطلاباً للحفظ.", "error");
        return;
      }
      const rows = selectedStudents.map((sid) => ({ teacher_id: teacherId, student_id: sid }));
      try {
        hideStatus();
        const { error } = await supabase
          .from("teacher_students")
          .upsert(rows, { onConflict: "teacher_id,student_id" });
        if (error) throw error;
        showStatus("تم حفظ الربط بنجاح ✅", "success");
        await loadTeacherStudentLinks();
      } catch (err) {
        console.error(err);
        showStatus("تعذر حفظ الربط", "error");
      }
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadTeacherStudentLinks());
  }
}

async function loadResultsTable() {
  if (!resultsTbody) return;
  resultsTbody.innerHTML = "";

  const { data: attempts, error } = await supabase
    .from("attempts")
    .select("user_id, score_percentage, created_at, exam_id, subject, level, student_name")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showStatus("تعذر تحميل النتائج", "error");
    toggleEmpty(resultsEmpty, true);
    return;
  }

  // map student info
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, class, student_number");
  const map = new Map((profiles || []).map((p) => [p.id, p]));

  toggleEmpty(resultsEmpty, !attempts || attempts.length === 0);

  (attempts || []).forEach((a) => {
    const student = map.get(a.user_id) || {};
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-3 py-2">${student.name || a.student_name || "-"}</td>
      <td class="px-3 py-2">${student.class || "-"}</td>
      <td class="px-3 py-2">${student.student_number || "-"}</td>
      <td class="px-3 py-2">${a.subject || "-"}</td>
      <td class="px-3 py-2">${a.level || "-"}</td>
      <td class="px-3 py-2">${typeof a.score_percentage === "number" ? a.score_percentage + "%" : "-"}</td>
      <td class="px-3 py-2">${a.created_at ? new Date(a.created_at).toLocaleString("ar-EG") : "-"}</td>
    `;
    resultsTbody.appendChild(tr);
  });
}
