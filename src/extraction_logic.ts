import { Site } from './types';
import { logger } from './utils/logger';

export function extractionLogic(site: Site, content: string): string {
    let match;
    if (site.regex) {
        const regPtn = new RegExp(site.regex);
        let firstMatchList = regPtn.exec(content);

        if (firstMatchList == null) { // todo fix this up to work differently
            return "NO MATCH FOUND";
        }
        else {
            return firstMatchList[0];
        }
    }
    else if (site.format == "json" && site.id == "cdc") {
        match = iterateThroughJson(["US_MAP_DATA", 60, "tot_cases_last_24_hours"], content)
    }
    else if (site.format == 'css_first' || site.format == 'css_last' || site.sendAnyChange) {
        match = content.substring(0, 30);
    }
    else {
        logger.warn("need regex, json pattern or other extraction logic. You got:\n" + content.substring(0, 30)); // default
        match = content.substring(0, 30);
    }
    if (!match) match = "NO MATCH FOUND"; // probably redundant with previous

    return match;
}

export function iterateThroughJson(jsonIndices: any[], content: any) {
    const jsonObj = JSON.parse(content);
    let match = jsonObj[jsonIndices.shift()]
    jsonIndices.forEach((objIndex) => {
        match = match[objIndex]
    })
    return match;
}
