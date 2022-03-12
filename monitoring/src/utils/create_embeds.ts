import { MessageEmbed } from 'discord.js';

export function createNotificationEmbed(site: {[x: string]: string}, prevUpdate: string): MessageEmbed {
    var embed = new MessageEmbed();
    embed.setTitle(`🔎 ${site.id} changed!`);
    embed.setURL(site.url);
    embed.addField(`Extraction Format`, `\`${site.format}\``, true);
    embed.addField(`Previous change`, `${prevUpdate}`, true,);
    embed.addField(`Updated on`, `${site.lastChecked}`, true);
    embed.setColor('FUCHSIA');
    return embed;
}

export function createMonitorListEmbed(embed: MessageEmbed, sitesToMonitor: any[], i: number) {
    embed.addField(`${sitesToMonitor[i].id}`, `URL: ${sitesToMonitor[i].url}\nCSS: \`${sitesToMonitor[i].contentSelector}\`\nChecked: ${sitesToMonitor[i].lastChecked}\nUpdated: ${sitesToMonitor[i].lastUpdated}\nRemove: \`!remove ${i + 1}\``);
    embed.setColor('FUCHSIA');
    return embed;
}