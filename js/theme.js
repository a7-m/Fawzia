// theme.js - centralized light/dark/system handling
const THEME_KEY = "theme";

/**
 * Detects the system's preferred color scheme.
 * @returns {string} 'dark' or 'light'
 */
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Updates the theme toggle button's icon and title based on the current mode.
 * @param {string} theme - The current theme mode ('light', 'dark', 'system')
 * @param {HTMLElement} toggle - The toggle button element
 * @param {HTMLElement} icon - The icon element
 */
function updateThemeIcon(theme, toggle, icon) {
  if (icon) {
    if (theme === "dark") {
      icon.textContent = "🌙";
    } else if (theme === "light") {
      icon.textContent = "☀️";
    } else {
      icon.textContent = "🌓"; // System/Auto
    }
  }
  if (toggle) {
    let title = "تبديل الثيم";
    if (theme === "dark") {
      title = "الوضع الليلي (اضغط للتبديل للوضع التلقائي)";
    } else if (theme === "light") {
      title = "الوضع النهاري (اضغط للتبديل للوضع الليلي)";
    } else {
      title = "الوضع التلقائي (اضغط للتبديل للوضع النهاري)";
    }
    toggle.title = title;
  }
}

/**
 * Applies the specified theme mode.
 * @param {string} theme - The theme mode to apply ('light', 'dark', 'system')
 */
export function applyTheme(theme = "system") {
  const html = document.documentElement;
  const body = document.body;
  const toggle = document.getElementById("themeToggle");
  const icon = document.querySelector(".theme-icon");

  let effectiveTheme = theme;
  if (theme === "system") {
    effectiveTheme = getSystemTheme();
  }

  const isDark = effectiveTheme === "dark";
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

/**
 * Initializes the theme based on saved preference or system default.
 */
export function initTheme() {
  // Always listen for system changes to update live if mode is 'system'
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.removeEventListener('change', handleSystemThemeChange); // Avoid dups
  mediaQuery.addEventListener('change', handleSystemThemeChange);

  const saved = localStorage.getItem(THEME_KEY) || "system";
  applyTheme(saved);

  setupToggleListener();
}

function handleSystemThemeChange() {
  if (localStorage.getItem(THEME_KEY) === "system") {
    applyTheme("system");
  }
}

function setupToggleListener() {
  const toggle = document.getElementById("themeToggle");
  if (toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = "true";
    toggle.addEventListener("click", () => {
      const current = localStorage.getItem(THEME_KEY) || "system";
      let next = "light";
      
      // Cycle: system -> light -> dark -> system
      if (current === "system") {
        next = "light";
      } else if (current === "light") {
        next = "dark";
      } else {
        next = "system";
      }

      applyTheme(next);
      document.body.classList.add("theme-transition");
      setTimeout(() => document.body.classList.remove("theme-transition"), 250);
    });
  }
}
