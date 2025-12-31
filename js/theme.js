// theme.js - centralized light/dark handling
const THEME_KEY = "theme";

function updateThemeIcon(theme, toggle, icon) {
  if (icon) {
    icon.textContent = theme === "dark" ? "☀️" : "🌙";
  }
  if (toggle) {
    toggle.title = theme === "dark" ? "تبديل إلى الوضع النهاري" : "تبديل إلى الوضع الليلي";
  }
}

export function applyTheme(theme = "light") {
  const html = document.documentElement;
  const body = document.body;
  const toggle = document.getElementById("themeToggle");
  const icon = document.querySelector(".theme-icon");

  const isDark = theme === "dark";
  html.classList.toggle("dark", isDark); // Tailwind dark
  body.classList.toggle("dark-theme", isDark);

  updateThemeIcon(theme, toggle, icon);
  localStorage.setItem(THEME_KEY, theme);
  if (typeof window.applyThemeStyles === "function") {
    try {
      window.applyThemeStyles();
    } catch (e) {
      console.warn("applyThemeStyles failed", e);
    }
  }
  window.__themeInitialized = true;
}

export function initTheme() {
  if (window.__themeInitialized) {
    // Ensure classes restored if another script cleared them
    applyTheme(localStorage.getItem(THEME_KEY) || "light");
    return;
  }

  const saved = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(saved);

  const toggle = document.getElementById("themeToggle");
  if (toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = "true";
    toggle.addEventListener("click", () => {
      const next = document.body.classList.contains("dark-theme") ? "light" : "dark";
      applyTheme(next);
      document.body.classList.add("theme-transition");
      setTimeout(() => document.body.classList.remove("theme-transition"), 250);
    });
  }
}
