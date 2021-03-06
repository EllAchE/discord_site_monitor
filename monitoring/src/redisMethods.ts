import { createClient } from "redis";
import { readJSONSync } from 'fs-extra';
import { logger } from "./utils/logger";
import { Client } from "discord.js";

/**
 * reads in JSON and creates hashes
 */
 export async function writeSiteJsonToRedis() {
    var tempJson: {[x: string]: string}[] = readJSONSync('src/json/sites.json');
  
    for (const site of tempJson) {
        console.log(site)
        writeSingleSiteToRedis(site, site.id);
    }
}

export async function resetRedis() {
    await REDIS_CLIENT.FLUSHALL()
}

export async function writeSingleSiteToRedis(site: {[x: string]: string}, id: string) {
    for (const [key, value] of Object.entries(site)) {
        await REDIS_CLIENT.hSet(id, key, value)
    }
}

export async function initializeRedisAndDiscordClients(client: Client, botToken: string | undefined) {
    // Connects to localhost:6379
    REDIS_CLIENT.on('error', (err) => console.log('Redis Client Error', err));
  
    await REDIS_CLIENT.connect();
    logger.info("Redis client connected")

    await resetRedis();
    await writeSiteJsonToRedis();
    logger.info("initialized client with json redis")
  
    if (botToken) {
        client.login(botToken)
    }
    else {
        logger.error(`No value for bot token, client failed to start`);
    }
}

export const REDIS_CLIENT = createClient();
