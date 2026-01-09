import { checkAuth, signOut, supabase, roleLanding } from "../auth/auth.js";
import { setStatus, hideStatus, toggle } from "../shared/helpers.js";

const statusEl = document.getElementById("statusMessage");
const resultsTbody = document.getElementById("resultsTableBody");
const resultsEmpty = document.getElementById("resultsEmpty");
const nameInput = document.getElementById("nameInput");
const classInfoEl = document.getElementById("classInfo");
const logoutBtn = document.getElementById("logoutBtn");

function renderClassInfo(cls) {
  if (!classInfoEl) return;
  if (!cls) {
    classInfoEl.textContent = "—";
    return;
  }
  const parts = [cls.name, cls.grade ? `الصف ${cls.grade}` : null].filter(Boolean);
  classInfoEl.textContent = parts.join(" | ") || "—";
}

async function loadProfile(uid) {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, class_id, classes!profiles_class_id_fkey(id, name, grade)")
    .eq("id", uid)
    .maybeSingle();
  if (error) throw error;
  if (nameInput) nameInput.value = data?.full_name || "";
  renderClassInfo(data?.classes || null);
}

async function saveProfile(uid) {
  const payload = { full_name: nameInput?.value?.trim() || null };
  const { error } = await supabase.from("profiles").update(payload).eq("id", uid);
  if (error) throw error;
}

async function loadResults(uid) {
  if (!resultsTbody) return;
  resultsTbody.innerHTML = "";
  const { data, error } = await supabase
    .from("attempts")
    .select("exam_id, subject, level, score_percentage, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error) throw error;

  toggle(resultsEmpty, !data || data.length === 0);
  (data || []).forEach((a, idx) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-3 py-2">محاولة ${idx + 1}</td>
      <td class="px-3 py-2">${a.subject || "-"}</td>
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
    if (user.role !== "student") {
      window.location.replace(roleLanding(user.role));
      return;
    }

    document.getElementById("studentName").textContent = user.name || user.email || "طالب";
    document.getElementById("studentEmail").textContent = user.email || "";
    if (logoutBtn) logoutBtn.addEventListener("click", () => signOut());

    await loadProfile(user.uid);
    await loadResults(user.uid);

    const formEl = document.getElementById("profileForm");
    if (formEl) {
      formEl.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          hideStatus(statusEl);
          await saveProfile(user.uid);
          setStatus(statusEl, "تم حفظ التعديلات بنجاح ✅", "success");
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
