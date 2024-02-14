# pronoun-bot

I'm the official Pronoun Picker bot for Discord! You can read more about me here: https://support.discord.com/hc/en-us/articles/1500012528941-Pronoun-Picker-Bot-FAQ.

## Commands

| Command            | Description                                         |
| ------------------ | --------------------------------------------------- |
| `/config view`     | View the current configuration                      |
| `/config reset`    | Reset a configuration option to its default setting |
| `/prompt`          | Createa pronoun selection prompt                    |
| `/pronouns add`    | Add a pronoun                                       |
| `/pronouns emoji`  | Edit an emoji from a pronoun                        |
| `/pronouns remove` | Remove a pronoun                                    |
| `/pronouns reset`  | Removes all non-default pronouns                    |

## Running locally

This bot uses Cloudflare Workers and KV Store.

- Create your own version of the application in discord.dev
- Copy `.example.dev.vars` to `.dev.vars`, and add your token, public key, and client id.
- Make sure you're using Node.js 20 or higher.
- Run `pnpm install`
- Run `pnpm run dev`

After making changes be sure to test them with `npm run build` and `npm run fix`.

## Required permissions

Today the bot requires the `bot` scope and the `Administrator` bot permission. This should really be addressed at some point.
