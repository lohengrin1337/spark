/**
 * @module theme
 * Handles theme toggling and interactive header animation(s)
 */

// ─────────────────────────────────────────────────────────────
// Initialize theme and header animations
// ─────────────────────────────────────────────────────────────
export function initTheme() {
  // Hide logout until header animations complete
  const logout = document.querySelector('.logout-admin');
  if (logout) {
    logout.classList.remove('visible');
  }

  // Enable pointer events only after animations finish
  document.querySelectorAll('.title-spark, .invoice-spark').forEach(el => {
    el.addEventListener('animationend', () => {
      el.style.pointerEvents = 'auto';

      // Show logout after animation finishes
      if (logout) {
        requestAnimationFrame(() => {
          logout.classList.add('visible');
        });
      }
    });
  });

  const html = document.documentElement;
  const toggle = document.getElementById("theme-toggle");

  if (!toggle) {
    console.warn("Theme toggle button not found.");
    return;
  }

  // Check for a saved theme in localStorage, if none exists, fallback to system/browser-preference
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  let savedTheme = localStorage.getItem("theme") || (prefersDark ? "dark" : "light");

  // Apply the initial theme class to document root
  html.classList.add(savedTheme + "-mode");

  // Toggle theme on button click
  toggle.addEventListener("click", () => {
    const current = html.classList.contains("dark-mode") ? "dark" : "light";
    const newTheme = current === "dark" ? "light" : "dark";

    html.classList.remove(current + "-mode");
    html.classList.add(newTheme + "-mode");

    // Save preference in localStorage
    localStorage.setItem("theme", newTheme);
  });
}
