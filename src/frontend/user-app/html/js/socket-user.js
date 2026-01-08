/**
 * @module socket-user
 * WebSocket for user app
 */

import * as MapMarkers from './user-mapMarkers.js';

const pending = new Map();
let lastApply = 0;
const APPLY_THROTTLE = 800;

function applyUpdates() {
  for (const [id, sc] of pending) {
    MapMarkers.updateScooterMarker(id, sc);
  }
  pending.clear();
}

export function initWebSocket() {
  const ws = new WebSocket(`ws://${location.hostname}:3000`);

  ws.onopen = () => {
    console.log('WebSocket connected - User App');
  };

  ws.onmessage = message => {
    try {
      const msg = JSON.parse(message.data);

      if (msg.type === 'completed_rental') return;

      if (msg.id !== undefined) {
        pending.set(msg.id, msg);

        if (Date.now() - lastApply > APPLY_THROTTLE) {
          applyUpdates();
          lastApply = Date.now();
        }
      }
    } catch (err) {
      console.error('WS message error:', err);
    }
  };

  ws.onclose = () => {
    console.warn('WebSocket closed - reconnecting...');
    setTimeout(() => location.reload(), 3000);
  };

  ws.onerror = (err) => console.error('WebSocket error:', err);
}