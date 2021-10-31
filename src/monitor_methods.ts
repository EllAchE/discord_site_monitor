import { JSDOM } from 'jsdom';
import { PREFIX, Site, SubstringSite } from './types';
import * as utils from './utils/utils';
import * as rss from 'rss-parser';
import { cronUpdate, parsePages } from './monitor';
import { MessageEmbed } from 'discord.js';
import { createMonitorListEmbed } from './utils/create_embeds';
import { Response } from 'got/dist/source';
import { logger } from './utils/logger';

export function getCssFromIndex(site: Site, response: Response, index: number): string | undefined {
    if (!site.index || site.index < 0) {
        logger.warn(`to run css_index index must be defined ${site.id}`);
        return "NO MATCH FOUND";
    }
    else {
        const dom = new JSDOM(response.body);
        return dom.window.document.querySelectorAll(site.contentSelector)[index]?.textContent;
    }
}

export async function getLastRss(site: Site, responseBody: string): Promise<string> {
    if (!site.contentSelector) {
        return "NO MATCH FOUND";
    }
    try {
        const parser = new rss();
        const content = await parser.parseString(responseBody);
        const itemIndex = site.index ? site.index : 0;

        return content.items[itemIndex][site.contentSelector]
    }
    catch {
        logger.warn(`error parsing rss on site with id: ${site.id}`)
        logger.debug(`response body was: ${responseBody}`)
        return "NO MATCH FOUND";
    }

}

export function getSubstringPrefixMatch(site: SubstringSite, responseBody: string): string {
    if (site.substring) {
        const indexOfSubString = responseBody.indexOf(site.substring)
        if (indexOfSubString == -1) {
            return "NO MATCH FOUND"
        }
        return responseBody.substring(indexOfSubString + site.substring.length, indexOfSubString + site.substring.length + 30);
    }
    return "NO MATCH FOUND";
}


export function removeSite(args: (string | number)[], message: any, sitesToMonitor: Site[], sitesFile: string): void {
    if (args.length === 0 || typeof args[0] == "number")
        message.channel.send(`Usage: \`${PREFIX}remove <NR [1-99]>\``);
    else if (parseInt(args[0]) < 1 || parseInt(args[0]) > 99 || parseInt(args[0]) > sitesToMonitor.length)
        message.channel.send(`Not a valid number. Usage: \`!remove <NR [1-99]>\``);
    else {
        const id = sitesToMonitor[parseInt(args[0]) - 1].id;
        sitesToMonitor.splice(parseInt(args[0]) - 1, 1);

        utils.saveOutputToJsonFile(sitesFile, sitesToMonitor);

        logger.info("removed site, now monitoring");
        logger.info(sitesToMonitor);
        message.channel.send(`Removed **${id}** from list.`);
    }
}

export function addSite(message: any, sitesToMonitor: Site[]) {
    // todo write method
}

export function updateSites(message: any, sitesToMonitor: Site[]) {
    message.channel.send(`Updating \`${sitesToMonitor.length}\` site(s)...`);
    parsePages();
    message.channel.send(`Done...`);
}

export function testSites(sitesToMonitor: Site[], sitesFile: string) {
    sitesToMonitor.forEach(site => site.hash = "hash");
    utils.saveOutputToJsonFile(sitesFile, sitesToMonitor);
    parsePages(true);
}

export function startCron(message: any) {
    cronUpdate.start();
    logger.info(`Cron started at ${new Date().toLocaleString()}`);
    message.channel.send(`Started monitoring...`);
}

export function stopCron(message: any) {
    cronUpdate.stop();
    logger.info(`Cron stopped at ${new Date().toLocaleString()}`);
    message.channel.send(`Paused website monitoring... Type \`!start\` to resume.`);
}

export function listMonitoredSites(message: any, sitesToMonitor: Site[]) {
    if (sitesToMonitor.length < 1)
        message.channel.send(`No sites to monitor. Add one with \`!add\`.`);
    else {
        var embed = new MessageEmbed()
        embed.setTitle(`${sitesToMonitor.length} site(s) being monitored:`);
        for (let i = 0; i < sitesToMonitor.length; i++) {
            createMonitorListEmbed(embed, sitesToMonitor, i);
        }
        message.channel.send({ embeds: [embed] });
    }
}