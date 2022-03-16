import { JSDOM } from 'jsdom';
import { Site } from './types';
import * as rss from 'rss-parser';
import { parsePages } from './monitor';
import { Response } from 'got/dist/source';
import { logger } from './utils/logger';

export function getCssFromIndex(site: {[x: string]: string}, response: Response): string | undefined {
    const validatedIndex: number = site.index ? parseInt(site.index) : -1;

    if (!validatedIndex || validatedIndex < 0) {
        logger.warn(`to run css_index index must be defined ${site.id}`);
        return "NO MATCH FOUND";
    }
    else {
        const dom = new JSDOM(response.body);
        return dom.window.document.querySelectorAll(site.contentSelector)[validatedIndex]?.textContent;
    }
}

export async function getLastRss(site: {[x: string]: string}, responseBody: string): Promise<string> {
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

export function getSubstringPrefixMatch(site: {[x: string]: string}, responseBody: string): string {
    if (site.substring) {
        const indexOfSubString = responseBody.indexOf(site.substring)
        if (indexOfSubString == -1) {
            return "NO MATCH FOUND"
        }
        return responseBody.substring(indexOfSubString + site.substring.length, indexOfSubString + site.substring.length + 30);
    }
    return "NO MATCH FOUND";
}

export function updateSites(message: any, sitesToMonitor: Site[]) {
    message.channel.send(`Updating \`${sitesToMonitor.length}\` site(s)...`);
    parsePages();
    message.channel.send(`Done...`);
}
