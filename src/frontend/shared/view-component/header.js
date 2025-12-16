import { initTheme } from '/shared/theme/theme.js';

class AppHeader extends HTMLElement {
  constructor() {
    super();

    const header = document.createElement('header');

    header.innerHTML = `
      <button id="theme-toggle">
        <img class="title-sun" src="img/sun.svg" alt="Toggle theme">
      </button>

      <h1 class="title">
        spark<span class="title-blink">_</span>
        <img class="title-spark" src="img/scooter-nobg.svg" alt="Spark Scooter">
      </h1>

      <nav>
        <div class="navlink-box">
          <a href="index.html">
            <img class="invoice-spark" src="img/admin.svg" alt="Admin">
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

customElements.define('app-header', AppHeader);
