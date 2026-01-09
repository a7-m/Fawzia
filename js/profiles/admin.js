import { checkAuth, signOut, supabase } from "../auth/auth.js";
import { setStatus, hideStatus, toggle } from "../shared/helpers.js";

const statusEl = document.getElementById("statusMessage");
const usersTbody = document.getElementById("usersTableBody");
const usersEmpty = document.getElementById("usersEmpty");
const classesTbody = document.getElementById("classesTableBody");
const classesEmpty = document.getElementById("classesEmpty");
const classNameInput = document.getElementById("classNameInput");
const classGradeInput = document.getElementById("classGradeInput");
const addClassBtn = document.getElementById("addClassBtn");
const teacherSelect = document.getElementById("teacherSelect");
const classesMulti = document.getElementById("classesMulti");
const linksTbody = document.getElementById("linksTableBody");
const linksEmpty = document.getElementById("linksEmpty");
const resultsTbody = document.getElementById("resultsTableBody");
const resultsEmpty = document.getElementById("resultsEmpty");

let classesCache = [];
let usersCache = [];
let teachersCache = [];

const roleOptions = ["admin", "teacher", "student"];

function classLabel(cls) {
  if (!cls) return "—";
  return `${cls.name}${cls.grade ? ` (الصف ${cls.grade})` : ""}`;
}

async function loadClasses() {
  const { data, error } = await supabase
    .from("classes")
    .select("id, name, grade, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  classesCache = data || [];
  renderClasses();
  hydrateClassSelectors();
}

function renderClasses() {
  if (!classesTbody) return;
  classesTbody.innerHTML = "";
  toggle(classesEmpty, classesCache.length === 0);
  classesCache.forEach((cls) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.dataset.cid = cls.id;
    tr.innerHTML = `
      <td class="px-3 py-2">${cls.name}</td>
      <td class="px-3 py-2">${cls.grade || "-"}</td>
      <td class="px-3 py-2">
        <button class="delete-class btn btn-sm btn-ghost" type="button">حذف</button>
      </td>
    `;
    classesTbody.appendChild(tr);
  });
}

function hydrateClassSelectors() {
  if (classesMulti) {
    classesMulti.innerHTML = "";
    classesCache.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = classLabel(c);
      classesMulti.appendChild(opt);
    });
  }
}

async function addClass() {
  const name = classNameInput?.value?.trim();
  const grade = classGradeInput?.value?.trim() || null;
  if (!name) {
    setStatus(statusEl, "الاسم مطلوب", "error");
    return;
  }
  const { error } = await supabase.from("classes").insert({ name, grade });
  if (error) throw error;
  classNameInput.value = "";
  if (classGradeInput) classGradeInput.value = "";
  await loadClasses();
  setStatus(statusEl, "تم إضافة الصف", "success");
}

async function deleteClass(classId) {
  const { error } = await supabase.from("classes").delete().eq("id", classId);
  if (error) throw error;
}

async function loadUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, full_name, class_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  usersCache = data || [];
  renderUsers();
}

function renderUsers() {
  if (!usersTbody) return;
  usersTbody.innerHTML = "";
  toggle(usersEmpty, usersCache.length === 0);

  usersCache.forEach((u) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.dataset.uid = u.id;
    const cls = classesCache.find((c) => c.id === u.class_id);
    tr.innerHTML = `
      <td class="px-3 py-2">
        <input data-field="full_name" class="w-full border rounded px-2 py-1 text-sm" value="${
          u.full_name || ""
        }" placeholder="الاسم" />
      </td>
      <td class="px-3 py-2 text-slate-600">${u.email || "-"}</td>
      <td class="px-3 py-2">
        <select data-field="role" class="border rounded px-2 py-1 text-sm bg-white">
          ${roleOptions
            .map(
              (r) =>
                `<option value="${r}" ${
                  u.role === r ? "selected" : ""
                }>${r}</option>`
            )
            .join("")}
        </select>
      </td>
      <td class="px-3 py-2">
        <select data-field="class_id" class="border rounded px-2 py-1 text-sm bg-white" ${
          u.role === "student" ? "" : "disabled"
        }>
          <option value="">—</option>
          ${classesCache
            .map(
              (c) =>
                `<option value="${c.id}" ${
                  u.class_id === c.id ? "selected" : ""
                }>${classLabel(c)}</option>`
            )
            .join("")}
        </select>
      </td>
      <td class="px-3 py-2">
        <button class="save-user btn btn-sm" type="button">حفظ</button>
      </td>
    `;
    usersTbody.appendChild(tr);
  });
}

async function saveUser(row) {
  const uid = row.dataset.uid;
  const payload = {};
  row.querySelectorAll("[data-field]").forEach((input) => {
    const key = input.dataset.field;
    const val = input.value?.trim();
    payload[key] = val === "" ? null : val;
  });
  const role = payload.role || "student";

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", uid);
  if (error) throw error;

  // Maintain student_classes
  if (role === "student") {
    await supabase.from("student_classes").delete().eq("student_id", uid);
    if (payload.class_id) {
      const { error: insertErr } = await supabase
        .from("student_classes")
        .insert({ student_id: uid, class_id: payload.class_id });
      if (insertErr) throw insertErr;
    }
    // If demoted from teacher remove teacher_classes
    await supabase.from("teacher_classes").delete().eq("teacher_id", uid);
  } else if (role === "teacher") {
    await supabase.from("student_classes").delete().eq("student_id", uid);
  } else {
    await supabase.from("student_classes").delete().eq("student_id", uid);
    await supabase.from("teacher_classes").delete().eq("teacher_id", uid);
  }
}

async function loadTeachers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "teacher")
    .order("full_name", { ascending: true });
  if (error) throw error;
  teachersCache = data || [];
  if (teacherSelect) {
    teacherSelect.innerHTML = "";
    teachersCache.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.full_name || t.email || "معلم";
      teacherSelect.appendChild(opt);
    });
  }
}

async function loadTeacherClassLinks() {
  if (!linksTbody) return;
  linksTbody.innerHTML = "";
  const { data, error } = await supabase
    .from("teacher_classes")
    .select(
      "teacher_id, class_id, classes(id, name, grade), teacher:teacher_id (full_name,email)"
    )
    .order("class_id", { ascending: true });
  if (error) throw error;

  toggle(linksEmpty, !data || data.length === 0);
  (data || []).forEach((row) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.dataset.teacherId = row.teacher_id;
    tr.dataset.classId = row.class_id;
    tr.innerHTML = `
      <td class="px-3 py-2">${
        row.teacher?.full_name || row.teacher?.email || "-"
      }</td>
      <td class="px-3 py-2">${classLabel(row.classes)}</td>
      <td class="px-3 py-2">
        <button class="remove-link btn btn-sm btn-ghost" type="button">حذف</button>
      </td>
    `;
    linksTbody.appendChild(tr);
  });
}

async function saveTeacherClasses(teacherId) {
  const selected = Array.from(classesMulti?.selectedOptions || []).map(
    (o) => o.value
  );
  await supabase.from("teacher_classes").delete().eq("teacher_id", teacherId);
  if (selected.length) {
    const rows = selected.map((class_id) => ({
      teacher_id: teacherId,
      class_id,
    }));
    const { error } = await supabase.from("teacher_classes").insert(rows);
    if (error) throw error;
  }
}

async function loadResults() {
  if (!resultsTbody) return;
  resultsTbody.innerHTML = "";
  const { data, error } = await supabase
    .from("attempts")
    .select(
      "user_id, subject, level, score_percentage, created_at, profile:profiles(id, full_name, class_id, classes!profiles_class_id_fkey(id, name, grade))"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  toggle(resultsEmpty, !data || data.length === 0);
  (data || []).forEach((a, idx) => {
    const cls = a.profile?.classes;
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-3 py-2">${a.profile?.full_name || `محاولة ${idx + 1}`}</td>
      <td class="px-3 py-2">${classLabel(cls)}</td>
      <td class="px-3 py-2">${a.subject || "-"}</td>
      <td class="px-3 py-2">${
        typeof a.score_percentage === "number" ? a.score_percentage + "%" : "-"
      }</td>
      <td class="px-3 py-2">${
        a.created_at ? new Date(a.created_at).toLocaleString("ar-EG") : "-"
      }</td>
    `;
    resultsTbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await checkAuth({ protected: true, adminOnly: true });
  if (!user) return;

  document.getElementById("adminName").textContent =
    user.name || user.email || "مشرف";
  document.getElementById("adminEmail").textContent = user.email || "";
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => signOut());

  try {
    await loadClasses();
    await loadUsers();
    await loadTeachers();
    await loadTeacherClassLinks();
    await loadResults();
  } catch (err) {
    console.error(err);
    setStatus(statusEl, "تعذر تحميل البيانات", "error");
  }

  if (addClassBtn) {
    addClassBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        hideStatus(statusEl);
        await addClass();
      } catch (err) {
        console.error(err);
        setStatus(statusEl, "تعذر إضافة الصف", "error");
      }
    });
  }

  if (classesTbody) {
    classesTbody.addEventListener("click", async (e) => {
      const btn = e.target.closest(".delete-class");
      if (!btn) return;
      const row = btn.closest("tr");
      const cid = row?.dataset.cid;
      if (!cid) return;
      try {
        hideStatus(statusEl);
        await deleteClass(cid);
        await loadClasses();
        await loadUsers();
        setStatus(statusEl, "تم حذف الصف", "success");
      } catch (err) {
        console.error(err);
        setStatus(statusEl, "تعذر حذف الصف", "error");
      }
    });
  }

  if (usersTbody) {
    usersTbody.addEventListener("click", async (e) => {
      const btn = e.target.closest(".save-user");
      if (!btn) return;
      const row = btn.closest("tr");
      try {
        hideStatus(statusEl);
        await saveUser(row);
        setStatus(statusEl, "تم حفظ التعديلات بنجاح ✅", "success");
      } catch (err) {
        console.error(err);
        setStatus(statusEl, "تعذر حفظ التعديلات", "error");
      }
    });
  }

  if (teacherSelect && classesMulti) {
    const assignBtn = document.getElementById("assignTeacherClasses");
    if (assignBtn) {
      assignBtn.addEventListener("click", async () => {
        const tid = teacherSelect.value;
        if (!tid) return;
        try {
          hideStatus(statusEl);
          await saveTeacherClasses(tid);
          await loadTeacherClassLinks();
          setStatus(statusEl, "تم حفظ ربط المعلم بالصفوف", "success");
        } catch (err) {
          console.error(err);
          setStatus(statusEl, "تعذر حفظ الربط", "error");
        }
      });
    }
  }

  if (linksTbody) {
    linksTbody.addEventListener("click", async (e) => {
      const btn = e.target.closest(".remove-link");
      if (!btn) return;
      const row = btn.closest("tr");
      const teacherId = row?.dataset.teacherId;
      const classId = row?.dataset.classId;
      if (!teacherId || !classId) return;
      try {
        hideStatus(statusEl);
        await supabase
          .from("teacher_classes")
          .delete()
          .eq("teacher_id", teacherId)
          .eq("class_id", classId);
        await loadTeacherClassLinks();
        setStatus(statusEl, "تم حذف الرابط", "success");
      } catch (err) {
        console.error(err);
        setStatus(statusEl, "تعذر حذف الرابط", "error");
      }
    });
  }
});
