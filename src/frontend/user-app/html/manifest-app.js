/**
 * Custom element that enables clean Progressive Web App (PWA)-functionality for the host document.
 *
 * Included like this in the html-template-index-<head>:
 * 
 * <manifest-app></manifest-app>
 *
 * @extends HTMLElement
 * @customElement manifest-app
 */
class ManifestApp extends HTMLElement {
  connectedCallback() {
    if (this.dataset.injected) return;
    this.dataset.injected = 'true';

    const head = document.head;

    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = 'manifest.json';
    head.appendChild(manifestLink);

    const themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    themeColor.content = '#000000';
    head.appendChild(themeColor);

    const appleCapable = document.createElement('meta');
    appleCapable.name = 'apple-mobile-web-app-capable';
    appleCapable.content = 'yes';
    head.appendChild(appleCapable);

    const appleStatusBar = document.createElement('meta');
    appleStatusBar.name = 'apple-mobile-web-app-status-bar-style';
    appleStatusBar.content = 'black';
    head.appendChild(appleStatusBar);

    const appleTitle = document.createElement('meta');
    appleTitle.name = 'apple-mobile-web-app-title';
    appleTitle.content = 'Spark';
    head.appendChild(appleTitle);

    const appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.href = '/icons/sparkd.png';
    head.appendChild(appleIcon);

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then(reg => console.log('Service Worker registered:', reg.scope))
          .catch(err => console.error('Service Worker registration failed:', err));
      });
    }
  }
}

customElements.define('manifest-app', ManifestApp);
