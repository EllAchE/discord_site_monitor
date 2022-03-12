import { readJSONSync } from 'fs-extra';
import { JSDOM } from 'jsdom';
import { createHash } from 'crypto';
import { Client, Intents, TextChannel, } from 'discord.js';
import { extractionLogic } from './extraction_logic';
import * as pdf from 'pdf-parse';
import { Site, SiteFormats  } from './types';
import { createNotificationEmbed } from './utils/create_embeds';
import { initializeClient, saveOutputToJsonFile, shouldIgnoreChange } from './utils/utils';
import { Response } from 'got/dist/source';
import { getCssFromIndex, getLastRss, getSubstringPrefixMatch } from './monitor_methods'
import { logger } from './utils/logger';
import { CLIENT } from './redis';

const got = require('got');
require('dotenv').config();

logger.info(__dirname)

const sitesFile: string = 'src/json/sites.json';

var sitesToMonitor: Site[] = [];


var client = new Client({
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

client.on('ready', (): void => { // Events when bot comes online
  var tempJson = readJSONSync(sitesFile); // Load saved sites
  sitesToMonitor = [...tempJson];

  logger.info(`[${client.user?.tag}] Page monitor bot ready...\n`);
  parsePages(true);
})

export async function parsePages(isInitialRun: boolean = false): Promise<void> { // Update the sites
  var tempJson = readJSONSync(sitesFile);

  // https://redis.io/commands/scan
  // https://github.com/redis/node-redis#scan-iterator
  for await (const key of CLIENT.scanIterator()) {
    CLIENT.hGetAll(key).then((site) => {
      got(site.url).then(response => {
        parseSwitch(site, response).then(async (content) => {
          const hash = createHash(`md5`).update(content.toString()).digest(`hex`); //Get content of site
  
          site.lastChecked = new Date().toLocaleString(); //Update time to last check
          site.match = extractionLogic(site, content);
  
          if (site.hash != hash) { // Check if new match differs from last match
            site.hash = hash;
            logger.debug(`Site hash changed ${site.id}. Content causing this was:`)
            logger.debug(content) // VERY verbose logs
  
            if (isInitialRun) {
              saveOutputToJsonFile(sitesFile, sitesToMonitor); // need to save on each iteration so that things are tracked after each change
              return; // early exit on first run
            }
  
            const channel: TextChannel | undefined = client.channels.cache.get(site.alertChannelId) as TextChannel // customize which channel the alert should appear in. Must be a text channel.
  
            if (channel) {
              // separately send parsed content
              if (!site.minDelta) site.minDelta = "0"
              if ((site.sendValueCheck === "true" && site.ignoreSmallChanges === "false") || (site.sendValueCheck === "true" && site.ignoreSmallChanges === "true" && !shouldIgnoreChange(site.base, site.match, parseFloat(site.minDelta)))) {
                site.base = site.match; // set base for comparison
                // todo this is where logic to act on a site trigger should be run from
                channel.send(`${site.match} ${site.extractionMessage} extracted from site ${site.id}`);
              }
  
              if (site.sendAnyChange === "true") { // send embed
                var embed = createNotificationEmbed(site, site.lastUpdated);
                channel.send({ embeds: [embed] }); //Send update to Discord channel
              }
            }
            else {
              // todo update messaging here (if any)
            }
  
            site.lastUpdated = site.lastChecked // Last change
            site.hash = hash;
  
            saveOutputToJsonFile(sitesFile, sitesToMonitor); // need to save on each iteration so that things are tracked after each change
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

  sitesToMonitor.forEach((site: Site) => {

  });
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

initializeClient(client, process.env.DISCORDJS_BOT_TOKEN?.toString());
