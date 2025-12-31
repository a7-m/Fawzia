import { supabase, checkAuth, isProfileComplete, roleLanding, pagePath, refreshCachedUser } from "./auth.js";

const statusEl = document.getElementById("statusMessage");
const formEl = document.getElementById("profileForm");
const roleInputs = () => Array.from(document.querySelectorAll('input[name="role"]'));
const nameInput = document.getElementById("name");
const classInput = document.getElementById("class");
const numberInput = document.getElementById("studentNumber");
const studentFields = document.getElementById("studentFields");
const submitBtn = document.getElementById("submitProfile");

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

function getSelectedRole() {
  const selected = roleInputs().find((r) => r.checked);
  return selected?.value || "";
}

function toggleStudentFields(role) {
  const isStudent = role === "student";
  if (studentFields) studentFields.classList.toggle("hidden", !isStudent);
  if (classInput) classInput.required = isStudent;
  if (numberInput) numberInput.required = isStudent;
}

function validate() {
  const role = getSelectedRole();
  const name = nameInput?.value.trim();
  const cls = classInput?.value.trim();
  const num = numberInput?.value.trim();
  const ok =
    role &&
    name &&
    (role !== "student" || (cls && num));
  if (submitBtn) {
    submitBtn.disabled = !ok;
    submitBtn.classList.toggle("opacity-50", !ok);
    submitBtn.classList.toggle("cursor-not-allowed", !ok);
  }
  return ok;
}

function bindValidation() {
  roleInputs().forEach((r) => {
    r.addEventListener("change", () => {
      toggleStudentFields(r.value);
      validate();
    });
  });
  [nameInput, classInput, numberInput].forEach((el) => {
    if (el) el.addEventListener("input", validate);
  });
}

function fillForm(profile) {
  if (!profile) return;
  const { role, name, class: cls, student_number: num } = profile;
  if (role) {
    const input = roleInputs().find((r) => r.value === role);
    if (input) input.checked = true;
    toggleStudentFields(role);
  }
  if (nameInput && name) nameInput.value = name;
  if (classInput && cls) classInput.value = cls;
  if (numberInput && num) numberInput.value = num;
  validate();
}

async function saveProfile(user) {
  const role = getSelectedRole();
  const name = nameInput.value.trim();
  const cls = classInput?.value.trim() || null;
  const num = numberInput?.value.trim() || null;

  try {
    hideStatus();
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-50", "cursor-not-allowed");
    const { error } = await supabase.from("profiles").upsert({
      id: user.uid,
      email: user.email,
      role,
      name,
      class: role === "student" ? cls : null,
      student_number: role === "student" ? num : null,
    });
    if (error) throw error;
    // refresh cache then redirect
    const { data: { session } } = await supabase.auth.getSession();
    await refreshCachedUser(session);
    const target = roleLanding(role);
    window.location.replace(target);
  } catch (err) {
    console.error(err);
    showStatus("تعذر حفظ البيانات. حاول مرة أخرى.", "error");
    submitBtn.disabled = false;
    submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await checkAuth({ protected: true, requireProfileComplete: false });
    if (!user) return;
    if (user.profileComplete) {
      window.location.replace(roleLanding(user.role));
      return;
    }

    // prefill if profile exists
    if (user.hasProfile) {
      const { data: { session } } = await supabase.auth.getSession();
      const refreshed = await refreshCachedUser(session);
      fillForm({
        role: refreshed.role,
        name: refreshed.name,
        class: refreshed.class,
        student_number: refreshed.number,
      });
    } else {
      toggleStudentFields("");
      validate();
    }

    bindValidation();

    if (formEl) {
      formEl.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!validate()) return;
        await saveProfile(user);
      });
    }
  } catch (err) {
    console.error(err);
    showStatus("تعذر تحميل البيانات. يرجى إعادة تسجيل الدخول.", "error");
  }
});
