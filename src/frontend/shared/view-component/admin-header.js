import { initTheme } from '/shared/theme/theme.js';

/**
 * Custom element for the admin interface header with theme toggle and admin link.
 */
class AdminHeader extends HTMLElement {
  constructor() {
    super();
    const header = document.createElement('header');
    header.innerHTML = `
      <button id="theme-toggle">
        <img class="title-sun" src="img/sun.svg" alt="Toggle theme">
      </button>

      <h1 class="title admin-title">
        spark
        <img class="title-spark" src="img/scooter-nobg.svg" alt="Spark Scooter">
      </h1>

      <nav>
        <div class="navlink-box">
          <a href="/index.html">
            <img class="invoice-spark" src="img/admin.svg" alt="Admin">
            
            <a class="logout-admin" href="/admin-login.html">
              <img class="logout-admin-img" src="img/logout.svg" alt="Logout Admin">
            </a>
          </a>
        </div>
      </nav>
    `;
    this.appendChild(header);
  }

  connectedCallback() {
    initTheme("#theme-toggle");

    const enableLogout = () => {
      const logoutLink = this.querySelector('.logout-admin');
      if (!logoutLink) return;

      const token = localStorage.getItem("token");
      if (!token) return;

      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        window.location.replace('/admin-login.html');
        console.log('Successfully Logged out')
      });
    };

    enableLogout();
  }
}

customElements.define('admin-header', AdminHeader);
