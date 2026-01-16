/**
 * @module theme
 * Centralized stable theme initialization + toggle handling for all views.
 *
 * Used in both admin-header and user-header view-components.
 */

const THEME_KEY = "theme";
const THEME_EVENT = "themeChanged";

// Guards & state
let animationHandlersBound = false;
let themeToggleClickHandlerBound = false;

// Direct theme change listeners
const themeChangeListeners = new Set();

/**
 * Returns the current theme based on <html> classes.
 */
export function getTheme() {
  const html = document.documentElement;
  return html.classList.contains("dark-mode") ? "dark" : "light";
}

/**
 * Returns the map tile URL template based on the theme.
 */
export function getTileURL(theme = getTheme()) {
  return theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
}

/**
 * Register a callback that will be run whenever the theme changes.
 *
 * Returns a function that closes over this callback so it can later be removed.
 */
export function onThemeChange(listener) {
  themeChangeListeners.add(listener);
  return () => themeChangeListeners.delete(listener);
}

/**
 * Initializes the theme for each view and sets up theme toggle functionality.
 * Applies saved theme or system preference, updates map tile URLs, and enables animations.
 */
export function initTheme({
  toggleSelector = ".theme-toggle",
  dispatchInitialEvent = true
} = {}) {
  // Resolve initial theme (saved or system preference)
  const prefersDark =
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;

  let savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme !== "light" && savedTheme !== "dark") {
    savedTheme = prefersDark ? "dark" : "light";
  }

  // Apply theme
  applyTheme(savedTheme);

  // Bind toggle handler once
  if (!themeToggleClickHandlerBound) {
    themeToggleClickHandlerBound = true;

    document.addEventListener("click", (e) => {
      const toggleEl = e.target?.closest?.(toggleSelector);
      if (!toggleEl) return;

      const current = getTheme();
      const next = current === "dark" ? "light" : "dark";

      applyTheme(next);
      emitThemeChanged(next);
    });
  }

  // Enable pointer events after animations finish (makes icon-links clickable)
  if (!animationHandlersBound) {
    animationHandlersBound = true;

    document
      .querySelectorAll(".title-spark, .invoice-spark, .user-spark")
      .forEach((el) => {
        el.addEventListener("animationend", () => {
          el.style.pointerEvents = "auto";
        });
      });
  }

  if (dispatchInitialEvent) {
    emitThemeChanged(savedTheme);
  }

  return { theme: savedTheme, tileURL: getTileURL(savedTheme) };
}

/**
 * Applies theme classes + persists theme + updates theme images.
 */
function applyTheme(theme) {
  const html = document.documentElement;

  // Class names aligned: light-mode / dark-mode
  html.classList.remove("light-mode", "dark-mode");
  html.classList.add(`${theme}-mode`);

  localStorage.setItem(THEME_KEY, theme);
  updateThemeImages(theme);
}

/**
 * Emits the canonical themeChanged
 */
function emitThemeChanged(theme) {
  const detail = { theme, tileURL: getTileURL(theme) };

  // DOM event
  document.dispatchEvent(new CustomEvent(THEME_EVENT, { detail }));

  themeChangeListeners.forEach((listener) => {
    try {
      listener(detail);
    } catch (err) {
      console.error("Theme listener failed:", err);
    }
  });
}

/**
 * Updates all theme-related images on the page.
 */
function updateThemeImages(theme) {
  document
    .querySelectorAll("img[data-light-src][data-dark-src]")
    .forEach((img) => {
      img.src = theme === "dark" ? img.dataset.darkSrc : img.dataset.lightSrc;
    });
}
