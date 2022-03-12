import { createClient } from 'redis';
import { readJSONSync } from 'fs-extra';
// Redis docs https://github.com/redis/node-redis

export const CLIENT = createClient();

// Connects to localhost:6379 
(async () => {
  CLIENT.on('error', (err) => console.log('Redis Client Error', err));

  await CLIENT.connect();
})();

/**
 * reads in JSON and creates hashes out of them
 */
 export async function writeToRedis() {
  var tempJson: {[x: string]: string}[] = readJSONSync('src/json/sites.json');

  for (const site of tempJson) {
    for (const [key, value] of Object.entries(site)) {
      await CLIENT.hSet(site.id, key, value)
    }
  }
}