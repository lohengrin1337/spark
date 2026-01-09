
const Redis = require('ioredis');

const redisOptions = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

// Publish-only connection
const redisPublisher = new Redis(redisOptions);
redisPublisher.on('connect', () => console.log('[Redis Publisher] Connected'));
redisPublisher.on('error', (err) => console.error('[Redis Publisher] Error:', err));

// Subscribe-only connection
const redisSubscriber = new Redis(redisOptions);
redisSubscriber.on('connect', () => console.log('[Redis Subscriber] Connected'));
redisSubscriber.on('error', (err) => console.error('[Redis Subscriber] Error:', err));

// Client connection for normal Redis commands (LRANGE etc)
const redisClient = new Redis(redisOptions);
redisClient.on('connect', () => console.log('[Redis Client] Connected'));
redisClient.on('error', (err) => console.error('[Redis Client] Error:', err));

process.on('SIGINT', async () => {
  try { await redisPublisher.quit(); } catch (_) {}
  try { await redisSubscriber.quit(); } catch (_) {}
  try { await redisClient.quit(); } catch (_) {}
  console.log('[Redis] All clients disconnected');
});

module.exports = { redisPublisher, redisSubscriber, redisClient };
