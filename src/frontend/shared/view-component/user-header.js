import { initTheme } from '../theme/theme.js';
import { loadCustomer } from '../js/api.js';
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

      <h1 class="title uw-title">
        <a href="index.html" class="title-sun" style="color: black; text-decoration: none;">
        spark<span class="title-blink">_</span>
        <img class="title-spark uw-spark" src="img/scooter-nobg.svg" alt="Spark Scooter">
      </h1>

      <nav>
        <div class="user-spark">
        <div><img style="height: 42px" src="/shared/img/user.svg" alt="User Panel"></div>
        <div><p id="logged-in-as"></p></div>
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
        initTheme("#theme-toggle");
    }
}

customElements.define('user-header', UserHeader);
