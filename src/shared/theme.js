// Function to handle the theme, to be shared by the frontend containers

export function themeHandler() {
    const html = document.documentElement;
    const toggle = document.getElementById("theme-toggle");
  
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const savedTheme = localStorage.getItem("theme");
  
    const initialTheme = savedTheme
      ? savedTheme
      : prefersDark
        ? "dark-mode"
        : "light-mode";
  
    html.classList.add(initialTheme);
  
    // If no toggle button exists (some pages may not have one) - early return
    if (!toggle) return;
  
    toggle.addEventListener("click", () => {
      const isDark = html.classList.contains("dark-mode");
      const newTheme = isDark ? "light-mode" : "dark-mode";
  
      html.classList.remove("light-mode", "dark-mode");
      html.classList.add(newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }

  export default themeHandler;