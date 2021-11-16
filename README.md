<p style="text-align:center">
  <h3 align="center">Discord Site Monitor and Parser</h3>
  <p align="center">A Discord bot that parses sites based on provided configurations and alerts you to those changes.</p>
</p>

---
## Credit
<a href="https://github.com/noelvissers/site-watcher/releases">Some code borrowed from Noel Vissers' "Site-watcher" project.</a>

## Features

Notify you in Discord when a website changes:   
![site-watcher](./.github/pictures/site-watcher.png)   
   
- Support a variety of formats, i.e. rss, pdf, html, json etc.
- Extract specific values from the site, and trigger alerts based on those values
- Add multiple sites to watcher
- Checks on a specified interval (cronjob, currently configured in the source code)).
- Update tracked sites via modification of the underlying json or via bot commands
- Open source!

## Setup
*These instructions are pretty sparse/a WIP and require some knowledge of typescript. I also didn't complete a usage section yet. If someone is interested in using this I can put one together.


1. Create a discord bot [discord.com/developers/applications](https://discord.com/developers/applications). A tutorial can be found [here](https://discordpy.readthedocs.io/en/latest/discord.html).   
2. Install npm packages, compile the typescript project

Configuring the bot:

1. Open the `.env` file.
2. Add `DISCORDJS_BOT_TOKEN=` followed by your discord bot's token. You can get the token from [discord.com/developers/applications](https://discord.com/developers/applications).
3. If you want to change the prefix (default "`s!`"), you can change it in `./src/types.ts` (`export const PREFIX = 's!';`).

## Usage
1. Invite the bot to your Discord server by replacing `123456789012345678` in the following link with your bot's client id: `https://discord.com/oauth2/authorize?client_id=123456789012345678&scope=bot&permissions=8`. 
2. Create a site config file called `sites.json` at the path src/json/sites.json. Follow the example shown in `sample-sites.json` to populate the file, OR...
3. Run the bot via node then add a website with the `!add <URL>` command. //(Still needs to be implemented)

For all other options, see [Commands](#Commands).

All details from here on are incomplete

## Commands
### `!help`
Show all the available commands.

**Parameters**   
None.

---

### `!add <URL>`
Adds a website to the list.

**Parameters**   
Required:   
`URL` The URL of the site you want to track.   

**Example**   
`!add https://google.com/` This tracks changes on https://google.com/.   
<sub>Note that some sites, including Google.com have dynamic elements (like ads) that cause a change every time its checked. To make sure these dynamic elements are filtered out, use the css selector parameter.</sub>   

`!add https://example.com/ "body > div > h1"` This tracks changes in header 1 of the site https://example.com/.

**Output**   
![add](./.github/pictures/add.png)

---

### `!remove <INDEX>`
Removes a website from the list.

**Parameters**   
Required:   
`INDEX` The index of the site you want to remove. Use `!list` to see the number of the site(s). NOTE - the list indexs are 1 indexed but you *must pass a zero indexed value to remove a site*

**Example**   
`!remove 0` This removes the first site in the list (`!list`).

**Output**   
![remove](./.github/pictures/remove.png)

---

### `!list`
Sends the list of websites being watched.

**Parameters**   
None.

**Example**   
`!list` This sends the list of websites being watched.

**Output**   
![list](./.github/pictures/list.png)

---

### `!listv`
Sends a verbose message with details for each of websites being watched.

**Parameters**   
None.

**Example**   
`!listv` This sends a verbose list of websites being watched. Verbose includes the full json configuration for each site.

**Output**   
![list](./.github/pictures/list.png)


---

### `!update`
Manually updates the sites that are being watched.

**Parameters**   
None.

**Example**   
`!update` This manually updates the sites that are being watched.   
<sub>If a site is updated, it will push the standard update message to the default update channel.</sub>

**Output**   
![update](./.github/pictures/update.png)

---

### `!interval <MINUTES>`
Set the interval/refresh rate of the watcher. Default `5` minutes.

**Parameters**   
`MINUTES` The interval in minutes (minimum of 1, maximum of 60).

**Example**   
`!interval 10` Sets the interval to 10 minutes.

**Output**   
![interval](./.github/pictures/interval.png)

---

### `!start`
Start the watcher with the specified interval (default `ON` with interval of `5` minutes).   
<sub>This uses [cron](https://www.npmjs.com/package/cron).</sub>

**Parameters**   
None.

**Example**   
`!start` This starts the watcher with the specified interval.

**Output**   
![start](./.github/pictures/start.png)

---

### `!stop`
Stops the watcher from automatically checking the tracked websites. Watcher can be resumed with `!start`.

**Parameters**   
None.

**Example**   
`!stop` This stops the watcher from automatically checking the tracked websites.


## Contribute
Not actively maintaining this, but if you think of some interesting use cases let me know and we can see about collaborating.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details




# Creating a config/sites file

A config/site object looks something like this:

  {
    "id": "jobless",
    "url": "https://www.dol.gov/ui/data.pdf",
    "contentSelector": "body",
    "lastChecked": "7/22/2021, 3:09:44 AM",
    "lastUpdated": "7/22/2021, 3:09:44 AM",
    "regex": "(?<= initial claims was ).*(?=, a ..crease)",
    "hash": "412adf44f97b7ac387ae276edbd1b8c3",
    "match": "360,000",
    "sendAnyChange": true,
    "index": null,
    "format": "pdf"
  }

The arguments to care about are:

*id*: for a predetermined monitor object, will affect how the returned content is parsed
*url*: the address of the data source
*contentSelector*: Used for css queries, retrieving nested json or whatever is appropriate for the case that you've defined
*regex*: used to clean up the string retrieved by earlier logic
*sendAnyChange*: If true will send the result of any update (yes or no), if false will only send an alert if the designated condition is met. You would have to define a null return for the failure condition (or false/undefined) to avoid triggering the send
*index*: if using css all will select the nth element as specified
*format*: Options are (currently): json, pdf, rss, css and cssall. They are what they say, cssall simply distinguishes if the queryselector will have multiple returns and if index is therefore necessary(or not)

## WIP, many features have been added/adapted since I last updated this page
