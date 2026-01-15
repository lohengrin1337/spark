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
 * The Device/Simulation container publishes JSON messages to these Redis channels: [ scooter:delta, rental:completed ]
 * 
 * ...and the the payload is broadcasted to all the connected frontend WebSocket clients.
 *
 * Also, as a sidenote, publishes trivial rental:completed to admin subscriber for the completed rentals live view.
 * 
 * Note: Important point to drive home: this acts not as a regular socket server, but as a socket (server) bridge.
 * 
 * This distinction is key, because although it is a server in the strict sense, handling clients connecting to it,
 * it does this as a stateless forwarderer of event driven data.
 * 
 * The source of truth of the scooter state is upstream in the simulation container, distributed via the
 * RedisPub/Sub-pipeline.
 * 
 * This humble socket setup thus simply connects and forwards that data stream to the frontends over WSS,
 * performing very basic parsing and stringification, yes, but in essence not handling, transforming or
 * persisting anything.
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
     * Subscribe to the authoritative Redis Pub/Sub scooter:delta-channel (and trivial
     * rental:completed channel).
     */
    redisSubscriber.subscribe('scooter:delta', 'rental:completed');
  
    /**
     * For every message published on any subscribed channel, the payload is parsed as JSON,
     * re-serialized, and then broadcast to all currently connected frontend WebSocket-clients.
     *
     * The channel-parameter is not used for any routing here: the frontend receives
     * a unified event stream and performs any filtering instead client-side.
     */
    redisSubscriber.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
  
        for (const client of clients) {
          if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error('[Redis] Failed to parse message:', err);
      }
    });
  
    return { clients };
  };
  