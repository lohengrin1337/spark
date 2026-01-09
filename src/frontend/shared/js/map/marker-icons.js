/**
 * @module marker-icons
 * Centralized module making the different colored status-based markers (svg)
 * available for Leaflet-rendering.
 */

const ICON_SIZE = [32, 32];
const ICON_ANCHOR = [16, 32];
const POPUP_ANCHOR = [0, -32];

const STATUS_TO_PATH = {
  available:     '/shared/img/markers/scooter-green.svg',
  active:        '/shared/img/markers/scooter-blue.svg',
  charging:      '/shared/img/markers/scooter-yellow.svg',
  reduced:       '/shared/img/markers/scooter-red.svg',
  deactivated:   '/shared/img/markers/scooter-grey.svg',
  needService:   '/shared/img/markers/scooter-orange.svg',
  needCharging:  '/shared/img/markers/scooter-yellow-nc.svg',
  needcharging:  '/shared/img/markers/scooter-yellow-nc.svg'
};


const CACHE = new Map();

CACHE.clear();

export function getScooterIcon(status = 'available') {
  let key = status?.toLowerCase().trim() || 'available';

  // Normalize known variations
  const normalize = {
    'idle': 'available',
    'available': 'available',
    'active': 'active',
    'in_use': 'active',
    'reduced': 'reduced',
    'deactivated': 'deactivated',
    'need_service': 'needService',
    'needservice': 'needService',
    'needsService': 'needService',
    'charging': 'charging',
    'needsCharging': 'needCharging',
    'needscharging': 'needCharging',
    'needCharging': 'needCharging'
  };

  key = normalize[key] || key;

  if (CACHE.has(key)) {
    return CACHE.get(key);
  }

  const url = STATUS_TO_PATH[key] || STATUS_TO_PATH.available;

  console.log('getScooterIcon key:', key, 'url:', url);

  const icon = L.icon({
    iconUrl: url,
    iconSize: ICON_SIZE,
    iconAnchor: ICON_ANCHOR,
    popupAnchor: POPUP_ANCHOR,
  });

  CACHE.set(key, icon);
  return icon;
}