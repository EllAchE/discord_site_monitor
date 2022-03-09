import { Client } from 'discord.js';
import { outputJSON } from 'fs-extra';
import { Site, SiteFormats } from '../types';
import { logger } from './logger';

export function saveOutputToJsonFile(filePath: string, saveContent: Site[]): void {
    saveContent.sort((a, b) => (a.id > b.id) ? 1 : -1)
    outputJSON(filePath, saveContent, { spaces: 2 }, err => {
        if (err)
            logger.error("error saving output to json", err);
    });
}
// TODO if reading/writing to json breaks firebase, or is too expensive, read from redis

export function writeToRedis() {
    return;
}

export function readFromRedis() {
    return;
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
