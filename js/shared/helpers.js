// Shared helper utilities
export const qs = (selector) => document.querySelector(selector);
export const qsa = (selector) => Array.from(document.querySelectorAll(selector));

export function setStatus(el, msg, type = "info") {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  el.className =
    "mb-4 px-4 py-3 rounded-xl text-sm font-semibold " +
    (type === "error"
      ? "bg-red-50 text-red-700 border border-red-200"
      : type === "success"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : "bg-slate-50 text-slate-700 border border-slate-200");
}

export function hideStatus(el) {
  if (el) el.classList.add("hidden");
}

export function toggle(el, show) {
  if (!el) return;
  el.classList.toggle("hidden", !show);
}
