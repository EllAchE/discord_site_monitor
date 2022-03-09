import { createClient } from 'redis';
// Redis docs https://github.com/redis/node-redis

export const CLIENT = createClient();

// Connects to localhost:6379 
(async () => {
  CLIENT.on('error', (err) => console.log('Redis Client Error', err));

  await CLIENT.connect();
})();

