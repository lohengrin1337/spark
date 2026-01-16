import { initTheme } from '/shared/theme/theme.js';

/**
 * Custom element for the admin interface header with theme toggle and admin link.
 */
class AdminHeader extends HTMLElement {
  constructor() {
    super();
    const header = document.createElement('header');
    header.innerHTML = `
      <button class="theme-toggle">
        <img class="title-sun" src="img/sun.svg" alt="Toggle theme">
      </button>

      <h1 class="title admin-title">
        spark
        <img class="title-spark" src="img/scooter-nobg.svg" alt="Spark Scooter">
      </h1>

      <nav>
        <div class="invoice-spark">
            <div><img style="height: 42px" src="img/admin.svg" alt="Admin"></div>
            <div><a id="logout-admin"></a></div>
        </div>
      </nav>
    `;
    this.appendChild(header);
  }

  connectedCallback() {
    initTheme(".theme-toggle");

    const token = localStorage.getItem("token");

    if (token) {
        const logoutLink = this.querySelector('#logout-admin');
        logoutLink.textContent = "logga ut";

        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            localStorage.removeItem("token");
            alert("loggar ut");
            window.location.replace('/admin-login.html');
        });
    }
  }
}

customElements.define('admin-header', AdminHeader);
