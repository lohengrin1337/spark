import { initTheme } from '/shared/theme/theme.js';
import { loadCustomer } from '/shared/js/api.js';

/**
 * Custom element for the user app interface header with theme toggle and user link.
 */
class UserAppHeader extends HTMLElement {
  constructor() {
    super();
    const header = document.createElement('header');
    header.innerHTML = `
      <button class="theme-toggle">
        <img class="title-sun" src="/shared/img/sun.svg" alt="Toggle theme">
      </button>

      <h1 class="title">
        spark<span class="title-blink">_</span>
        <img class="title-spark" src="img/scooter-nobg.svg" alt="Spark Scooter">
        <p class="title-app-mobile">App</p>
      </h1>


      <nav>
      <div class="user-spark">
      <div>
      <a href="user-app-panel.html">
      <img style="height: 42px;" src="/shared/img/user.svg" alt="User Panel"></div>
      <div> <p id="logged-in-as" class="user-app-logged-in-text"></p></p></div>
      </a>
      </div>
    </nav>
    `;
    this.appendChild(header);
  }

  async connectedCallback() {
      
    const loggedIn = this.querySelector('#logged-in-as');
    try {
        const customer = await loadCustomer();
        if (customer) {
          if (customer.blocked) {
            loggedIn.textContent = `Kontot är spärrat`;
            loggedIn.classList.add("blocked-account");
            loggedIn.setAttribute("data-info", "Betala dina fakturor och kontakta kundtjänst");
          } else {
            loggedIn.textContent = customer.name ? `Välkommen, ${customer.name}` : `Välkommen, anonyma kund`;
          }
        }
      } catch (e) {
          console.error(e);
      }
      initTheme(".theme-toggle");
  }
}

customElements.define('user-app-header', UserAppHeader);