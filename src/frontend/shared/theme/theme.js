/**
 * Initializes the theme for each view and sets up theme toggle functionality.
 * Applies saved theme or system preference, updates map tile URLs, and enables animations.
 * 
 * Used in both admin-header and user-header view-components.
 * 
 * @returns {string} The URL-template for map tiles, based on the current theme.
 */
export function initTheme() {
    const html = document.documentElement;
    const toggle = document.getElementById("theme-toggle");
  
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    let savedTheme = localStorage.getItem("theme");
    if (!savedTheme) savedTheme = prefersDark ? "dark" : "light";

    updateThemeImages(savedTheme);
  
    html.classList.add(savedTheme + "-mode");
  
    /**
     * Returns the map tile URL template based on the theme
     * @param {string} theme - The current theme ('light' or 'dark')
     * @returns {string} Tile URL template
     */
    function getTileURL(theme) {
      return theme === "dark"
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  
    if (toggle.dataset.bound === "true") return;
    toggle.dataset.bound = "true";
    toggle.addEventListener("click", () => {
      const current = html.classList.contains("dark-mode") ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
  
      html.classList.remove(current + "-mode");
      html.classList.add(next + "-mode");
      localStorage.setItem("theme", next);

      updateThemeImages(next);
  
      document.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme: next, tileURL: getTileURL(next) }
      }));
    });

    // Enable pointer events after animations finish (makes icon-links clickable)
    document.querySelectorAll('.title-spark, .invoice-spark, .user-spark').forEach(el => {
        el.addEventListener('animationend', () => {
          el.style.pointerEvents = 'auto';
        });
    });
  
    return getTileURL(savedTheme);
}

/**
 * Updates all theme-related images on the page
 * @param {string} theme - light/dark
 */
function updateThemeImages(theme) {
  document
    .querySelectorAll('img[data-light-src][data-dark-src]')
    .forEach(img => {
      img.src = theme === 'dark'
        ? img.dataset.darkSrc
        : img.dataset.lightSrc;
    });
}
