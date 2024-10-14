// config/redis.js
const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            // Maximum retry delay is 3000ms
            return Math.min(retries * 50, 3000);
        }
    }
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// Connect to redis
(async () => {
    await redisClient.connect();
})();

module.exports = redisClient;