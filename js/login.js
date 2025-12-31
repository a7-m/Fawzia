import { signIn, checkAuth, pagePath, supabase, OAUTH_REDIRECT, roleLanding, refreshCachedUser } from "./auth.js";

const statusEl = document.getElementById("statusMessage");

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

function parseOAuthError() {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const err = params.get("error") || hashParams.get("error");
  const desc = params.get("error_description") || hashParams.get("error_description");
  if (err || desc) {
    showStatus(desc || "تعذر إتمام تسجيل الدخول عبر Google.", "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
    // Redirect if already logged in (and profile complete)
    const user = await checkAuth({ protected: false });
    if (user && user.profileComplete) {
        window.location.replace(roleLanding(user.role));
        return;
    }
    parseOAuthError();

    // Login Form Listener
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value;

            try {
                hideStatus();
                const user = await signIn(email, password);
                if (user) {
                    if (!user.profileComplete) {
                        window.location.replace(pagePath("complete-profile.html"));
                        return;
                    }
                    window.location.replace(roleLanding(user.role));
                }
            } catch (err) {
                console.error(err);
                showStatus("فشل تسجيل الدخول: " + (err.message === "Invalid login credentials" ? "بيانات الدخول غير صحيحة" : err.message), "error");
            }
        });
    }

    // Google Login (Placeholder)
    const googleBtn = document.getElementById("googleLogin");
    if (googleBtn) {
        googleBtn.addEventListener("click", async () => {
            try {
                hideStatus();
                googleBtn.disabled = true;
                googleBtn.classList.add("opacity-60", "cursor-not-allowed");
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: OAUTH_REDIRECT }
                });
                if (error) throw error;
                // Redirect handled by Supabase; nothing else to do here.
            } catch (err) {
                console.error(err);
                showStatus("تعذر بدء تسجيل الدخول عبر Google. حاول مرة أخرى.", "error");
                googleBtn.disabled = false;
                googleBtn.classList.remove("opacity-60", "cursor-not-allowed");
            }
        });
    }
});
