import { initTheme } from '/shared/theme/theme.js';

/**
 * Custom element for the user interface header with theme toggle and user link.
 */
class UserHeader extends HTMLElement {
  constructor() {
    super();
    const header = document.createElement('header');
    header.innerHTML = `
      <button id="theme-toggle">
        <img class="title-sun" src="/shared/img/sun.svg" alt="Toggle theme">
      </button>

      <h1 class="title">
        spark<span class="title-blink">_</span>
        <img class="title-spark" src="img/scooter-nobg.svg" alt="Spark Scooter">
      </h1>

      <nav>
        <div class="navlink-box">
          <a href="user-panel.html">
            <img class="user-spark" src="/shared/img/user.svg" alt="User Panel">
          </a>
        </div>
      </nav>
    `;
    this.appendChild(header);
  }

  connectedCallback() {
    initTheme("#theme-toggle");
  }
}

customElements.define('user-header', UserHeader);