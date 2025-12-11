/**
 * @module cities
 * City coordinates and link bindings enabling quick map navigation.
 */
export const CITIES = {
    'karlskrona-link': [56.1618, 15.5875],
    'malmo-link':      [55.6050, 13.0038],
    'umea-link':       [63.8258, 20.2630]
  };
  
  export function initCityLinks(switchTo) {
    document.querySelectorAll('.karlskrona-link, .malmo-link, .umea-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const cityKey = link.classList[0];
        const coords = CITIES[cityKey];
        if (coords) {
          switchTo(coords[0], coords[1]);
        }
      });
    });
  }