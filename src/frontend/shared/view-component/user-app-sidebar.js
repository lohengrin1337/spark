/**
 * Custom element for navigation and logout.
 */
class UserAppSidebar extends HTMLElement {
  constructor() {
    super();
    const sidebar = document.createElement('sidebar');
    sidebar.className = "sidebar";
    sidebar.innerHTML = `
            <a href="user-app-panel.html">
                <img class="invoice-img" src="/shared/img/user.svg" alt="User Panel">
            <a href="user-app-invoices.html">
                <img class="invoice-img" src="/shared/img/invoice.svg" alt="Invoice Svg">
            </a>
            <a href="user-app-rentals.html">
                <img class="trip-img" src="/shared/img/trip.svg" alt="Trip Svg">
            </a>
            <a href="index.html">
            <img class="map-img" src="/shared/img/map2.svg" alt="Map Svg">
            </a>
            <br>
            <h1 id="logout" class="link-pointer" style="cursor: pointer">Logga ut</h1>
    `;
    this.appendChild(sidebar);
  }

  connectedCallback() {
    const token = localStorage.getItem("token");
    const logoutButton = this.querySelector('#logout');

    if (!token) {
        logoutButton.computedStyleMap.display = "none";
        return;
    }

    logoutButton.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        globalThis.location?.replace("/user-app-login.html");
    });
  }
}

customElements.define('user-app-sidebar', UserAppSidebar);
