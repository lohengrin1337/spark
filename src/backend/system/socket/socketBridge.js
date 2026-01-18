/**
 * @module socketBridge.js
 * 
 * Minimalistic WebSocket bridge: 
 * 
 * Redis Pub/Sub from Simulation Container -> WebSocket Bridge (WSS) -> Frontend containers
 *
 * Forwards all real-time events published by the device container (via Redis Pub/Sub), where 
 * the scooter state exist, to any connected frontend clients over a raw, low overhead WebSocket-connection (wss).
 * 
 * The Device/Simulation container publishes JSON messages to these Redis channels: [ scooter:state:tick, rental:completed ]
 * 
 * ...and the the payload is broadcasted to all the connected frontend WebSocket clients.
 *
 * Also, as a sidenote, publishes trivial rental:completed to admin subscriber for the completed rentals live view.
 * 
 * Note: Important distinction: this component exposes a WebSocket server endpoint, but it is not an
 * application-level socket server.
 *
 * Although it accepts and manages WebSocket connections, it does not own domain state, protocol semantics, 
 * or client-specific behavior. It functions purely as a transport bridge that forwards event-driven data.
 *
 * All scooter state is resolved upstream in the simulation container and distributed via Redis Pub/Sub. 
 * This module merely terminates that internal transport and re-broadcasts the same authoritative event
 * stream to connected frontend clients.
 * 
 * Conceptualizing and treating this component as a bridge ensures that frontend expectations can be kept
 * neutral and clear, and that all the multiple independent clients can safely consume the same
 * coherent, consistent data.
 * 
 */

module.exports = function initSocketBridge(wss, redisSubscriber) {

    /**
     * Set of all the currently connected frontend WebSocket clients.
     */
    const clients = new Set();
  
    /**
     * Handle new frontend WebSocket connections.
     *
     * Each frontend establishes their own raw WSS connection.
     */
    wss.on('connection', (ws) => {
      console.log('Frontend connected via raw WebSocket');
      clients.add(ws);
  
      /**
       * Remove the socket when the frontend disconnects so it no longer receives published events.
       */
      ws.on('close', () => {
        clients.delete(ws);
        console.log('Frontend disconnected');
      });
    });
  
  
  /**
   * Subscribe to authoritative Redis Pub/Sub channels emitting resolved events.
   *
   * These channels carry already-decided, self-contained event payloads.
   */
  redisSubscriber.subscribe('scooter:state:tick', 'rental:completed');

  /**
   * Forward each published event verbatim to all connected frontend WebSocket clients.
   *
   * The bridge does not inspect, validate, transform, or route events.
   * It simply terminates the internal Redis transport and re-exposes the same
   * event stream to the frontend clients.
   *
   */
  redisSubscriber.on('message', (channel, message) => {
    for (const client of clients) {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    }
  });

  
    return { clients };
  };
  