/**
 * Custom element for navigation and logout.
 */
class UserSidebar extends HTMLElement {
  constructor() {
    super();
    const sidebar = document.createElement('sidebar');
    sidebar.className = "sidebar";
    sidebar.innerHTML = `
            <a href="user-panel.html">
                <img class="invoice-img" src="/shared/img/user.svg" alt="User Panel">
            </a>
            <a href="rentals.html">
                <img class="trip-img" src="/shared/img/trip.svg" alt="Trip Svg">
            </a>
            <a href="invoices.html">
                <img class="invoice-img" src="/shared/img/invoice.svg" alt="Invoice Svg">
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
        window.location.replace("/user-login.html");
    });
  }
}

customElements.define('user-sidebar', UserSidebar);
