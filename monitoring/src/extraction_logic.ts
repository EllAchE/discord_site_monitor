import { SiteFormats } from './types';
import { logger } from './utils/logger';

export function extractionLogic(
  site: { [x: string]: string },
  content: string
): string {
  let match;

  if (site.regex) {
    const regPtn = new RegExp(site.regex);
    let firstMatchList = regPtn.exec(content);

    if (firstMatchList == null) {
      return 'NO MATCH FOUND';
    } else {
      return firstMatchList[0];
    }
  } else if (site.format == SiteFormats.json) {
    match = iterateThroughJson(JSON.parse(site.jsonIndices), content);
  } else if (
    site.format == SiteFormats.css_first ||
    site.format == SiteFormats.css_last ||
    site.format === SiteFormats.css_index ||
    site.sendAnyChange === 'true'
  ) {
    match = content.substring(0, 30);
  } else {
    logger.warn(site.format);
    logger.warn(
      'need regex, json pattern or other extraction logic. First 30 characters of the response:\n' +
        content.substring(0, 30)
    );
    match = content.substring(0, 30);
  }
  if (!match) match = 'NO MATCH FOUND'; // probably redundant with previous

  return match;
} // todo want to expose a return type in a triggered change for use in further logic

export function iterateThroughJson(jsonIndices: any[], content: any) {
  const jsonObj = JSON.parse(content);
  let match = jsonObj[jsonIndices.shift()];
  jsonIndices.forEach((objIndex) => {
    match = match[objIndex];
  });

  return match;
}
