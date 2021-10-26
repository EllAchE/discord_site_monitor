import { Client } from 'discord.js';
import { outputJSON } from 'fs-extra';
import { Site, SiteFormats } from '../types';
import { logger } from './logger';

export function extractArgumentsFromString(argsTemp: string): (string | number)[] {
    var regexp: RegExp = /[^\s"]+|"([^"]*)"/gi;
    let match;
    const resArr: string[] = [];
    do {
        match = regexp.exec(argsTemp);
        if (match != null) {
            resArr.push(match[1] ? match[1] : match[0]);
        }
    } while (match != null);
    return resArr;
}

export function saveOutputToJsonFile(filePath: string, saveContent: any): void {
    outputJSON(filePath, saveContent, { spaces: 2 }, err => {
        if (err)
            logger.error(err);
    });
}

export function shouldIgnoreChange(base: string, match: string, minDelta: number) {
    if (Math.abs(parseFloat(base) - parseFloat(match)) < minDelta) {
        return true
    }
    return false
}

export const cleanNumberString = (str: string | number, isInt: boolean): number => {
    if (typeof (str) == "string") {
        str = str.replace(/,/g, '').replace(/%/g, '').replace(/\$/g, '')
        return isInt ? parseInt(str) : parseFloat(str);
    }
    else {
        return str
    }
}

export function initializeClient(client: Client, botToken: string | undefined) {
    if (botToken) {
        client.login(botToken)
    }
    else {
        logger.error(`No value for bot token, client failed to start`);
    }
}

export const createBaseSiteObject = (url: string): Site => {
    const currentTime: string = new Date().toLocaleString();
    return {
        id: url.split('/')[2],
        url: url,
        alertChannelId: process.env.DEFAULT_ALERTING_CHANNEL_ID ? process.env.DEFAULT_ALERTING_CHANNEL_ID : "",
        format: SiteFormats.css_first,
        lastChecked: currentTime,
        lastUpdated: currentTime,
        hash: "",
        match: "NO MATCH FOUND",
        sendAnyChange: true,
        sendValueCheck: true,
        base: ""
    };
}