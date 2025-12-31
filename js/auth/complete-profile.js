import { supabase, checkAuth, roleLanding, refreshCachedUser, COMPLETE_PROFILE_PAGE } from "./auth.js";
import { setStatus, hideStatus, toggle } from "../shared/helpers.js";

const statusEl = document.getElementById("statusMessage");
const formEl = document.getElementById("profileForm");
const roleInput = document.getElementById("roleInput");
const nameInput = document.getElementById("fullName");
const studentSection = document.getElementById("studentSection");
const teacherSection = document.getElementById("teacherSection");
const studentClassSelect = document.getElementById("studentClassSelect");
const teacherClassesSelect = document.getElementById("teacherClassesSelect");
const submitBtn = document.getElementById("submitProfile");

const logAndShowError = (context, error) => {
  console.error(`[complete-profile] ${context}`, error);
  const msg = error?.message || error?.error_description || error?.toString?.() || "خطأ غير معروف";
  alert(`خطأ: ${msg}`);
  setStatus(statusEl, msg, "error");
};

function enableSubmit(ok) {
  if (!submitBtn) return;
  submitBtn.disabled = !ok;
  submitBtn.classList.toggle("opacity-50", !ok);
  submitBtn.classList.toggle("cursor-not-allowed", !ok);
}

function validate(role) {
  const name = nameInput?.value?.trim();
  const isStudent = role === "student";
  const isTeacher = role === "teacher";
  const studentOk = !isStudent || !!studentClassSelect?.value;
  const teacherOk = !isTeacher || (teacherClassesSelect && teacherClassesSelect.selectedOptions.length > 0);
  const ok = !!role && !!name && studentOk && teacherOk;
  enableSubmit(ok);
  return ok;
}

function applyRole(role) {
  toggle(studentSection, role === "student");
  toggle(teacherSection, role === "teacher");
  validate(role);
}

function hydrateClassesSelect(classes) {
  const render = (select) => {
    if (!select) return;
    select.innerHTML = "";
    classes.forEach((cls) => {
      const opt = document.createElement("option");
      opt.value = cls.id;
      opt.textContent = `${cls.name}${cls.grade ? ` (الصف: ${cls.grade})` : ""}`;
      select.appendChild(opt);
    });
  };
  render(studentClassSelect);
  render(teacherClassesSelect);
}

async function loadClasses() {
  const { data, error } = await supabase.from("classes").select("id, name, grade").order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function saveProfile(user, role) {
  const fullName = nameInput?.value?.trim();
  const selectedClassId = studentClassSelect?.value || null;
  const updates = { full_name: fullName, class_id: role === "student" ? selectedClassId : null };

  try {
    hideStatus(statusEl);
    enableSubmit(false);

    // تأكد من وجود صف في profiles (خصوصاً حسابات Google)
    const ensurePayload = { id: user.uid, email: user.email, role: role || "student" };
    const { error: ensureErr } = await supabase.from("profiles").upsert(ensurePayload, { onConflict: "id" });
    if (ensureErr) throw ensureErr;

    const { error: updateErr } = await supabase.from("profiles").update({ ...updates, role }).eq("id", user.uid);
    if (updateErr) throw updateErr;

    if (role === "teacher") {
      const selectedIds = Array.from(teacherClassesSelect?.selectedOptions || []).map((o) => o.value);
      const { error: delErr } = await supabase.from("teacher_classes").delete().eq("teacher_id", user.uid);
      if (delErr) throw delErr;
      if (selectedIds.length) {
        const rows = selectedIds.map((class_id) => ({ teacher_id: user.uid, class_id }));
        const { error: insertErr } = await supabase.from("teacher_classes").insert(rows);
        if (insertErr) throw insertErr;
      }
    }

    if (role === "student") {
      const { error: delErr } = await supabase.from("student_classes").delete().eq("student_id", user.uid);
      if (delErr) throw delErr;
      if (selectedClassId) {
        const { error: studentErr } = await supabase
          .from("student_classes")
          .insert({ student_id: user.uid, class_id: selectedClassId });
        if (studentErr) throw studentErr;
      }
    }

    const { data: { session } } = await supabase.auth.getSession();
    await refreshCachedUser(session);
    window.location.replace(roleLanding(role));
  } catch (err) {
    logAndShowError("saveProfile", err);
    enableSubmit(true);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const provider = session?.user?.app_metadata?.provider;

    const user = await checkAuth({ protected: true, requireProfileComplete: false });
    if (!user) return;

    if (user.profileComplete) {
      window.location.replace(roleLanding(user.role));
      return;
    }

    // Force role from profile (no localStorage)
    const role = user.role || "student";
    if (roleInput) roleInput.value = role;
    applyRole(role);

    const classes = await loadClasses();
    hydrateClassesSelect(classes);

    // Prefill
    if (nameInput) nameInput.value = user.name || "";
    if (role === "student" && user.classId && studentClassSelect) {
      studentClassSelect.value = user.classId;
    }
    if (role === "teacher" && teacherClassesSelect) {
      const ids = (user.teacherClasses || []).map((t) => t.class_id);
      Array.from(teacherClassesSelect.options).forEach((opt) => {
        opt.selected = ids.includes(opt.value);
      });
    }

    validate(role);

    if (formEl) {
      formEl.addEventListener("submit", async (e) => {
        e.preventDefault();
        const currentRole = roleInput?.value || role;
        if (!validate(currentRole)) return;
        await saveProfile(user, currentRole);
      });
    }

    if (roleInput) {
      roleInput.addEventListener("change", (e) => {
        applyRole(e.target.value);
      });
    }
    if (nameInput) nameInput.addEventListener("input", () => validate(roleInput?.value || role));
    if (studentClassSelect) studentClassSelect.addEventListener("change", () => validate(roleInput?.value || role));
    if (teacherClassesSelect) teacherClassesSelect.addEventListener("change", () => validate(roleInput?.value || role));
  } catch (err) {
    console.error(err);
    setStatus(statusEl, "تعذر تحميل البيانات. يرجى إعادة تسجيل الدخول.", "error");
  }
});
