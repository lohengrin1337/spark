/**
 * @module cities
 * 
 * City coordinates and link bindings enabling quick map navigation.
 */

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// User App (city + coords)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export const CITIESUSERAPP = {
  'karlskrona-link': { city: 'karlskrona', lat: 56.1618, lng: 15.5875 },
  'malmo-link':      { city: 'malmö',      lat: 55.6050, lng: 13.0038 },
  'umea-link':       { city: 'umeå',       lat: 63.8258, lng: 20.2630 }
};

export function initCityLinksUserApp(switchToCityUserApp) {
  document.querySelectorAll('.karlskrona-link, .malmo-link, .umea-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();

      const cityKey = Object.keys(CITIESUSERAPP).find(k => link.classList.contains(k));
      const cty = CITIESUSERAPP[cityKey];

      console.log('cityKey:', cityKey, 'cty:', cty);

      if (cty) {
        switchToCityUserApp(cty.city, cty.lat, cty.lng);
      }
    });
  });
}

