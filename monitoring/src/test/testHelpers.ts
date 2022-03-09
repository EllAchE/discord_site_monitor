import { SubstringSite, Site, SiteFormats } from "../types";

export const getEmptyMockSite = (): SubstringSite => {
    return {
        contentSelector: "",
        id: "",
        url: "",
        alertChannelId: "",
        lastChecked: "",
        lastUpdated: "",
        hash: "",
        match: "",
        sendAnyChange: false,
        sendValueCheck: false,
        ignoreSmallChanges: false,
        format: SiteFormats.substring,
        substring: "",
        base: "",
        minDelta: 0
    }
}

export const getValidMockSite = (): Site => {
    return {
        contentSelector: "title",
        id: "testId",
        url: "testUrl",
        alertChannelId: "",
        lastChecked: "",
        lastUpdated: "",
        hash: "111222asdfas",
        match: "",
        sendAnyChange: false,
        sendValueCheck: false,
        ignoreSmallChanges: false,
        format: SiteFormats.css_first,
        base: "aaaaa",
        minDelta: 0,
    }
}
