import { signIn, checkAuth, supabase, OAUTH_REDIRECT, roleLanding, refreshCachedUser, COMPLETE_PROFILE_PAGE } from "./auth.js";
import { setStatus, hideStatus } from "../shared/helpers.js";

const statusEl = document.getElementById("statusMessage");

function parseOAuthError() {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const err = params.get("error") || hashParams.get("error");
  const desc = params.get("error_description") || hashParams.get("error_description");
  if (err || desc) {
    setStatus(statusEl, desc || "تعذر إتمام تسجيل الدخول عبر Google.", "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Redirect if already logged in (and profile complete)
  const user = await checkAuth({ protected: false, requireProfileComplete: false });
  if (user) {
    if (!user.profileComplete) {
      window.location.replace(COMPLETE_PROFILE_PAGE);
      return;
    }
    window.location.replace(roleLanding(user.role));
    return;
  }

  parseOAuthError();

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      try {
        hideStatus(statusEl);
        const signedIn = await signIn(email, password);
        if (signedIn) {
          if (!signedIn.profileComplete) {
            window.location.replace(COMPLETE_PROFILE_PAGE);
            return;
          }
          window.location.replace(roleLanding(signedIn.role));
        }
      } catch (err) {
        console.error(err);
        const msg =
          err.message === "Invalid login credentials"
            ? "بيانات الدخول غير صحيحة"
            : err.message || "فشل تسجيل الدخول";
        setStatus(statusEl, msg, "error");
      }
    });
  }

  const googleBtn = document.getElementById("googleLogin");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        hideStatus(statusEl);
        googleBtn.disabled = true;
        googleBtn.classList.add("opacity-60", "cursor-not-allowed");
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: OAUTH_REDIRECT },
        });
        if (error) throw error;
      } catch (err) {
        console.error(err);
        setStatus(statusEl, "تعذر بدء تسجيل الدخول عبر Google. حاول مرة أخرى.", "error");
        googleBtn.disabled = false;
        googleBtn.classList.remove("opacity-60", "cursor-not-allowed");
      }
    });
  }
});
