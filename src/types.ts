export interface Site {
    id: string;
    url: string;
    alertChannelId: string;
    lastChecked: string;
    lastUpdated: string;
    hash: string;
    match: string;
    sendAnyChange: boolean;
    sendValueCheck: boolean;
    format: SiteFormats;
    base: string;
    ignoreSmallChanges?: boolean;
    minDelta?: number;
    regex?: string;
    contentSelector?: string;
}

export interface SubstringSite extends Site {
    substring: string;
}

export interface CssIndexSite extends Site {
    index: number;
} // todo fix these so that casting and type inference etc. isn't needed

export enum SiteFormats {
    pdf = "pdf",
    css_first = "css_first",
    css_index = "css_index",
    css_last = "css_last",
    html_change = "html_change",
    substring = "substring",
    rss = "rss",
    json = "json",
}

export enum BotCommands {
    LIST = "LIST",
    REMOVE = "REMOVE",
    STOP = "STOP",
    START = "START",
    TEST = "TEST",
    UPDATE = "UPDATE",
    ADD = "ADD",
    HELP = "HELP"
}

export const PREFIX = 's!'; //Change to any prefix