import { initTheme } from '/shared/theme/theme.js';

/**
 * Custom element for the user interface header with theme toggle and user link.
 */
class UserSidebar extends HTMLElement {
  constructor() {
    super();
    const sidebar = document.createElement('sidebar');
    sidebar.className = "sidebar";
    sidebar.innerHTML = `
            <a href="user-panel.html">
                <img class="invoice-img" src="/shared/img/user.svg" alt="User Panel">
            <a href="invoices.html">
                <img class="invoice-img" src="/shared/img/invoice.svg" alt="Invoice Svg">
            </a>
            <a href="rentals.html">
                <img class="trip-img" src="/shared/img/trip.svg" alt="Trip Svg">
            </a>
            <br>
            <h1 id="logout" class="link-pointer" style="cursor: pointer">Logga ut</h1>
    `;
    this.appendChild(sidebar);
  }

  connectedCallback() {
    initTheme("#theme-toggle");
    const token = localStorage.getItem("token");
    const logoutButton = this.querySelector('#logout');

    if (!token) {
        logoutButton.computedStyleMap.display = "none";
        return;
    }

    logoutButton.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        window.location.replace("/user-login.html");
    });
  }
}

customElements.define('user-sidebar', UserSidebar);