import { JSDOM } from 'jsdom';
import { Client, Intents, TextChannel } from 'discord.js';
import * as pdf from 'pdf-parse';
import { SiteFormats  } from './types';
import got, { Response } from 'got';
import { getCssFromIndex, getLastRss, getSubstringPrefixMatch } from './monitor_methods'
import { logger } from './utils/logger';
import { initializeRedisAndDiscordClients, REDIS_CLIENT, writeSingleSiteToRedis } from './redisMethods';
import { createHash } from 'crypto';
import { extractionLogic } from './extraction_logic';
import { createNotificationEmbed } from './utils/create_embeds';
import { shouldIgnoreChange } from './utils/utils';

require('dotenv').config();

logger.info(__dirname)

var DISCORD_CLIENT = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_WEBHOOKS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_PRESENCES
  ]
});

DISCORD_CLIENT.on('ready', (): void => { // Events when bot comes online
  logger.info(`[${DISCORD_CLIENT.user?.tag}] Page monitor bot ready...\n`);
  parsePages();
})

export async function parsePages(): Promise<void> { // Update the sites
  // reads site file and initializes the client with the data from sites in it

  // https://redis.io/commands/scan
  // https://github.com/redis/node-redis#scan-iterator
  for await (const key of REDIS_CLIENT.scanIterator()) {
    REDIS_CLIENT.hGetAll(key).then(
      (site) => {
        got(site.url).then(response => {
          parseSwitch(site, response).then(async (content) => {
            const hash = createHash(`md5`).update(content.toString()).digest(`hex`); // Get content of site
    
            site.lastChecked = new Date().toLocaleString(); //Update time to last check
            site.match = extractionLogic(site, content);
    
            if (site.hash != hash) { // Check if new match differs from last match
              site.hash = hash;
              logger.info('Changed site hash')
              logger.info(site.id)
              logger.info(site.hash)
              const channel: TextChannel = DISCORD_CLIENT.channels.cache.get(site.alertChannelId) as TextChannel // customize which channel the alert should appear in. Must be a text channel.
    
              if (!site.minDelta) {
                site.minDelta = "0"
              }

              // separately send parsed content
              if ((site.sendValueCheck === "true" && site.ignoreSmallChanges === "false") ||(site.sendValueCheck === "true" && site.ignoreSmallChanges === "true" && !shouldIgnoreChange(site.base, site.match, parseFloat(site.minDelta)))) {
                site.base = site.match; // set base for comparison
                channel.send(`${site.match} extracted from site ${site.id}`);
              }
   
              if (site.sendAnyChange === "true") { // send embed
                var embed = createNotificationEmbed(site, site.lastUpdated);
                channel.send({ embeds: [embed] }); //Send update to Discord channel
              }
    
              site.lastUpdated = site.lastChecked // Last change
              writeSingleSiteToRedis(site, site.id)
            }
          }).catch(err => {
            return logger.error(`Error in site with ID: ${site.id}`, err);
          });
        }).catch(err => {
          return logger.error(`Error in site with ID: ${site.id}`, err);
        });
      }).catch((err) => {
        logger.error(err)
      });
    }
}

export async function parseSwitch(site: {[x: string]: string}, response: Response): Promise<string> {
  let content;
  switch (site.format) {
    case SiteFormats.pdf: {
      content = await pdf(response.rawBody)
      content = content.text
    } break;
    case SiteFormats.css_first: {
      const dom = new JSDOM(response.body); //Get content of site
      content = dom.window.document.querySelector(site.contentSelector)?.textContent;
    } break;
    case SiteFormats.css_index: {
      content = getCssFromIndex(site, response);
    } break;
    case SiteFormats.css_last: {
      const dom = new JSDOM(response.body);
      const queryArray = dom.window.document.querySelectorAll(site.contentSelector)
      content = queryArray[queryArray.length - 1].textContent;
    } break;
    case SiteFormats.html_change: {
      const dom = new JSDOM(response.body);
      content = dom.window.document.querySelector(site.contentSelector)?.outerHTML;
    } break;
    case SiteFormats.substring: {
      content = getSubstringPrefixMatch(site, (response.body as any).toString());
    } break;
    case SiteFormats.rss: {
      content = getLastRss(site, (response.body as any).toString());
    } break;
    case SiteFormats.json: {
      content = response.body; // will be further extracted in extraction logic functions
    } break;
    default: {
      throw Error(`need to specify pdf, html or other site type in site ${site.id}`)
    }
  }
  if (!content) {
    content = "NO MATCH FOUND"
    logger.warn(`no match found for query in site ${site.id}`)
  }
  return content;
}

initializeRedisAndDiscordClients(DISCORD_CLIENT, process.env.DISCORDJS_BOT_TOKEN?.toString())
