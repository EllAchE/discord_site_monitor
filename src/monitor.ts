import { CronJob, CronTime } from 'cron';
import { readJSONSync } from 'fs-extra';
import { JSDOM } from 'jsdom';
import { createHash } from 'crypto';
import { Client, Intents, TextChannel, } from 'discord.js';
import { extractionLogic } from './extraction_logic';
import * as utils from './utils/utils';
import * as pdf from 'pdf-parse';
import { BotCommands, CssIndexSite, PREFIX, Site, SiteFormats, SubstringSite } from './types';
import { createHelpEmbed, createNotificationEmbed } from './utils/create_embeds';
import { initializeClient, saveOutputToJsonFile, shouldIgnoreChange } from './utils/utils';
import { Response } from 'got/dist/source';
import { getCssFromIndex, getLastRss, getSubstringPrefixMatch, listMonitoredSites, removeSite, startCron, stopCron, testSites, updateSites } from './monitor_methods'
import { logger } from './utils/logger';

const got = require('got');
require('dotenv').config();

logger.info(__dirname)

const sitesFile: string = 'src/json/sites.json'; // todo validate that this works
const settingsFile: string = 'src/json/settings.json';

var sitesToMonitor: Site[] = [];
var cronInterval: number = 1;

const cronString = `0 */${cronInterval} 6-23 * * *`;

var client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
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

  cronInterval = readJSONSync(settingsFile).interval; // Load saved settings

  if (cronInterval < 60) // Start monitoring
    cronUpdate.setTime(new CronTime(cronString));
  else
    cronUpdate.setTime(new CronTime(`0 * * * * *`));
  cronUpdate.start();

  logger.info(tempJson);
  logger.info(`[${client.user?.tag}] Page monitor bot ready...\n`);
  logger.info(`cron interval is ${cronInterval}`);
  parsePages(true);
})

client.on(`messageCreate`, (message: any): void => { // Events on message
  if (!message.content.startsWith(PREFIX) || message.author.bot) return; // Check if message starts with prefix and remove prefix from string
  logger.info(`[${message.author.tag}]: ${message.content}`);
  const argsTemp = message.content.slice(PREFIX.length).trim();

  var args = utils.extractArgumentsFromString(argsTemp); // Split the string in command, and arguments. This part splits on spaces except if it is between quotes ("a b")

  const CMD_NAME = args.shift()?.toString().toLowerCase(); // Ignore command case mismatch
  logger.info(CMD_NAME)

  switch (CMD_NAME?.toUpperCase()) {
    case BotCommands.LIST:
      listMonitoredSites(message, sitesToMonitor);
      break;
    case BotCommands.REMOVE:
      removeSite(args, message, sitesToMonitor, sitesFile);
      break;
    case BotCommands.STOP:
      stopCron(message);
      break;
    case BotCommands.STOP:
      startCron(message);
      break;
    case BotCommands.TEST:
      testSites(sitesToMonitor, sitesFile);
      break;
    case BotCommands.UPDATE:
      updateSites(message, sitesToMonitor);
      break;
    case BotCommands.ADD:
      // todo this needs to be reimplemented
      break;
    case BotCommands.HELP:
      message.channel.send({ embeds: [createHelpEmbed()] })
      break;
    default:
      message.channel.send(`Invalid command...\nType \`${PREFIX}help\` for a list of commands.`)
  }
})

//Update on set interval
export const cronUpdate = new CronJob(cronString, function (): void {
  logger.info(`Web mon cron executed at ${new Date().toLocaleString()}`);
  try {
    parsePages(false).catch(err => {
      logger.error("parsePages promise rejected with reason", err);
    });
  }
  catch (err) {
    logger.error(`cron error`, err)
  }
}, null, false);


export async function parsePages(isInitialRun: boolean): Promise<void> { // Update the sites
  var tempJson = readJSONSync(sitesFile);
  sitesToMonitor = [...tempJson];
  sitesToMonitor.forEach((site: Site) => {
    got(site.url).then(response => {
      parseSwitch(site, response).then(async (content) => {
        const hash = createHash(`md5`).update(content.toString()).digest(`hex`); //Get content of site

        site.lastChecked = new Date().toLocaleString(); //Update time to last check
        site.match = extractionLogic(site, content);

        if (site.hash != hash) { // Check if new match differs from last match
          site.hash = hash;
          logger.debug(`Site hash changed ${site.id}. Content causing this was:`)
          logger.debug(content)

          if (isInitialRun) {
            utils.saveOutputToJsonFile(sitesFile, sitesToMonitor); // need to save on each iteration so that things are tracked after each change
            return; // early exit on first run
          }

          const channel: TextChannel | undefined = client.channels.cache.get(site.alertChannelId) as TextChannel // customize which channel the alert should appear in. Must be a text channel.

          if (channel) {
            if (site.sendAnyChange) { // send embed
              var embed = createNotificationEmbed(site, site.lastUpdated);
              channel.send({ embeds: [embed] }); //Send update to Discord channel
            }

            // separately send parsed content
            if (!site.minDelta) site.minDelta = 0
            if ((site.sendValueCheck && !site.ignoreSmallChanges) || (site.sendValueCheck && site.ignoreSmallChanges && !shouldIgnoreChange(site.base, site.match, site.minDelta))) {
              site.base = site.match; // set base for comparison
              channel.send(`Extracted ${site.match} from site ${site.id}`);
            }
          }
          else {

          }

          site.lastUpdated = site.lastChecked // Last change
          site.hash = hash;

          saveOutputToJsonFile(sitesFile, sitesToMonitor); // need to save on each iteration so that things are tracked after each change
        }
      }).catch(err => {
        return logger.error(`Error: ${err}. ID: ${site.id}`);
      });
    })
  });
}

export async function parseSwitch(site: Site, response: Response): Promise<string> {
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
      const validatedIndex: number = (site as CssIndexSite).index ? (site as CssIndexSite).index : -1;
      if (typeof ((site as CssIndexSite).index) != "number" || (site as CssIndexSite).index == -1) logger.warn(`index must be defined to run css_index in site ${site.id}`);
      content = getCssFromIndex((site as CssIndexSite), response, validatedIndex);
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
      content = getSubstringPrefixMatch((site as SubstringSite), (response.body as any).toString());
    } break;
    case SiteFormats.rss: {
      content = getLastRss(site, (response.body as any).toString());
    } break;
    case SiteFormats.json: {
      content = response.body; // will be further extracted in extraction logic functions
    } break;
    default: {
      throw `need to specify pdf, html or other site type in site ${site.id}`
    }
  }
  if (!content) {
    content = "NO MATCH FOUND"
    logger.warn(`no match found for query in site ${site.id}`)
  }
  return content;
}



initializeClient(client, process.env.DISCORDJS_BOT_TOKEN?.toString());
