const Redis = require('ioredis');

const redisOptions = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

// Publisher
const redisPublisher = new Redis(redisOptions);
redisPublisher.on('connect', () => console.log('[Redis Publisher] Connected'));
redisPublisher.on('error', (err) => console.error('[Redis Publisher] Error:', err));

// Subscriber
const redisSubscriber = new Redis(redisOptions);
redisSubscriber.on('connect', () => console.log('[Redis Subscriber] Connected'));
redisSubscriber.on('error', (err) => console.error('[Redis Subscriber] Error:', err));

// Client
const redisClient = new Redis(redisOptions);
redisClient.on('connect', () => console.log('[Redis Client] Connected'));
redisClient.on('error', (err) => console.error('[Redis Client] Error:', err));

process.on('SIGINT', async () => {
  try {
    await redisPublisher.quit();
    await redisSubscriber.quit();
    await redisClient.quit();
    console.log('[Redis] All clients disconnected');
  } catch (err) {
    console.error('[Redis] Error during shutdown:', err);
  } finally {
    process.exit(0);
  }
});

module.exports = { redisPublisher, redisSubscriber, redisClient };
