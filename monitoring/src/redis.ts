import { createClient } from 'redis';
import { readJSONSync } from 'fs-extra';
// Redis docs https://github.com/redis/node-redis

export const CLIENT = createClient();

// Connects to localhost:6379 
(async () => {
  CLIENT.on('error', (err) => console.log('Redis Client Error', err));

  await CLIENT.connect();
})();

// TODO if reading/writing to json breaks firebase, or is too expensive, read from redis
/**
 * reads in JSON and creates hashes out of them
 * @returns 
 */
 export async function writeToRedis() {
  const sitesFile: string = 'src/json/sites.json';
  var tempJson: {[x: string]: string}[] = readJSONSync(sitesFile);

  for (const site of tempJson) {
      await CLIENT.multi()
      .hSet(site.id, "url", site.url)
      .hSet(site.id, "hash", site.hash)
      .hSet(site.id, "match", site.match)
      .hSet(site.id, "sendAnyChange", site.sendAnyChange)
      .hSet(site.id, "sendValueCheck", site.sendValueCheck)
      .hSet(site.id, "format", site.format)
      .hSet(site.id, "base", site.base)
      .hSet(site.id, "alertChannelId", site.alertChannelId)

      // .hSet(site.id, "lastChecked", site.lastChecked)
      // .hSet(site.id, "lastUpdated", site.lastUpdated)

      // .hSet(site.id, "extractionMessage", site.extractionMessage)
      // .hSet(site.id, "ignoreSmallChanges", site.ignoreSmallChanges)
      // .hSet(site.id, "index", site.index)
      // .hSet(site.id, "minDelta", site.minDelta)
      // .hSet(site.id, "regex", site.regex)
      // .hSet(site.id, "contentSelector", site.contentSelector)
      // .hSet(site.id, "substring", site.substring)
  }
  return;
}