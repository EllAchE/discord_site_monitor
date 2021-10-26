import { PREFIX, Site } from '../types';
import { MessageEmbed } from 'discord.js';

export function createNotificationEmbed(site: Site, prevUpdate: string): MessageEmbed {
    var embed = new MessageEmbed();
    embed.setTitle(`🔎 ${site.id} changed!`);
    embed.setURL(site.url);
    embed.addField(`Extraction Format`, `\`${site.format}\``, true);
    embed.addField(`Previous change`, `${prevUpdate}`, true,);
    embed.addField(`Updated on`, `${site.lastChecked}`, true);
    embed.setColor('FUCHSIA');
    return embed;
}

export function createHelpEmbed(): MessageEmbed {
    var embed = new MessageEmbed();
    embed.setTitle("Commands");
    embed.setColor('FUCHSIA');
    embed.addField(`\`${PREFIX}help\``, `Show all commands.`);
    embed.addField(`\`${PREFIX}list\``, `Show list of added sites.`);
    embed.addField(`\`${PREFIX}update\``, `Manually update sites.`);
    embed.addField(`\`${PREFIX}interval\``, `Set update interval, default \`5\`.`);
    embed.addField(`\`${PREFIX}start\``, `Start automatic monitoring on set interval, default \`on\`.`);
    embed.addField(`\`${PREFIX}status\``, `Show monitoring status.`);
    embed.addField(`\`${PREFIX}test\``, `Overwrite site hash to test they update correctly.`);
    embed.addField(`\`${PREFIX}remove <NR>\``, `Remove site from list.`);
    //embed.addField(`\`${PREFIX}add <URL> "<CSS SELECTOR>"\``, `Add site monitor with optional CSS selector.`);
    //embed.addField(`\`${PREFIX}addhtml <URL> "<CSS SELECTOR>"\``, `Add site monitor that tracks html changes.`);
    //embed.addField('\`${PREFIX}doubletime\``, `Run cron more frequently.');
    //embed.addField(`\`${PREFIX}stop\``, `Stop monitoring.`);
    return embed;
}

export function createMonitorListEmbed(embed: MessageEmbed, sitesToMonitor: any[], i: number) {
    embed.addField(`${sitesToMonitor[i].id}`, `URL: ${sitesToMonitor[i].url}\nCSS: \`${sitesToMonitor[i].contentSelector}\`\nChecked: ${sitesToMonitor[i].lastChecked}\nUpdated: ${sitesToMonitor[i].lastUpdated}\nRemove: \`!remove ${i + 1}\``);
    embed.setColor('FUCHSIA');
    return embed;
}