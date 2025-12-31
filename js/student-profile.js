import { checkAuth, signOut, supabase, roleLanding } from "./auth.js";

const statusEl = document.getElementById("statusMessage");
const resultsTbody = document.getElementById("resultsTableBody");
const resultsEmpty = document.getElementById("resultsEmpty");
const formEl = document.getElementById("profileForm");
const nameInput = document.getElementById("nameInput");
const classInput = document.getElementById("classInput");
const numberInput = document.getElementById("numberInput");

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
  if (user.role !== "student") {
    window.location.replace(roleLanding(user.role));
    return;
  }

  document.getElementById("studentName").textContent = user.name || user.email || "طالب";
  document.getElementById("studentEmail").textContent = user.email || "";

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => signOut());

  await loadProfile(user.uid);
  await loadResults(user.uid);
  bindForm(user.uid);
});

async function loadProfile(uid) {
  const { data, error } = await supabase
    .from("profiles")
    .select("name,class,student_number")
    .eq("id", uid)
    .single();
  if (error) {
    console.error(error);
    showStatus("تعذر تحميل البيانات", "error");
    return;
  }
  if (nameInput) nameInput.value = data?.name || "";
  if (classInput) classInput.value = data?.class || "";
  if (numberInput) numberInput.value = data?.student_number || "";
}

function bindForm(uid) {
  if (!formEl) return;
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: nameInput?.value?.trim() || null,
      class: classInput?.value?.trim() || null,
      student_number: numberInput?.value?.trim() || null,
    };
    try {
      hideStatus();
      const { error } = await supabase.from("profiles").update(payload).eq("id", uid);
      if (error) throw error;
      showStatus("تم حفظ التعديلات بنجاح ✅", "success");
    } catch (err) {
      console.error(err);
      showStatus("تعذر حفظ التعديلات", "error");
    }
  });
}

async function loadResults(uid) {
  if (!resultsTbody) return;
  resultsTbody.innerHTML = "";
  const { data, error } = await supabase
    .from("attempts")
    .select("exam_id, score_percentage, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    showStatus("تعذر تحميل النتائج", "error");
    toggleEmpty(resultsEmpty, true);
    return;
  }
  toggleEmpty(resultsEmpty, !data || data.length === 0);
  (data || []).forEach((a, idx) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-3 py-2">محاولة ${idx + 1}</td>
      <td class="px-3 py-2">${typeof a.score_percentage === "number" ? a.score_percentage + "%" : "-"}</td>
      <td class="px-3 py-2">${a.created_at ? new Date(a.created_at).toLocaleString("ar-EG") : "-"}</td>
    `;
    resultsTbody.appendChild(tr);
  });
}
