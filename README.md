# Getting Started app for Discord

This project contains a Discord interactions app built for the [getting started guide](https://discord.com/developers/docs/getting-started). It runs as a Cloudflare Worker, verifies Discord interaction requests, responds to pings, and includes message commands.

![Demo of app](https://github.com/discord/discord-example-app/raw/main/assets/getting-started-demo.gif?raw=true)

## Project structure
Below is a basic overview of the project structure:

```
├── examples    -> short, feature-specific sample apps
│   ├── app.js  -> finished app.js code
│   ├── button.js
│   ├── command.js
│   ├── modal.js
│   ├── selectMenu.js
├── .env.sample -> sample .env file
├── app.js      -> Cloudflare Worker interactions handler
├── commands.js -> slash command payloads + helpers
├── custom-commands.json -> custom message command names and responses
├── custom-commands.js   -> loads command data for registration
├── utils.js    -> utility functions and enums
├── wrangler.jsonc -> Cloudflare Worker configuration
├── package.json
├── README.md
└── .gitignore
```

## Running app locally

Before you start, you'll need to install [NodeJS](https://nodejs.org/en/download/) and [create a Discord app](https://discord.com/developers/applications) with the proper permissions:
- `applications.commands`
- `bot` (with Send Messages enabled)


Configuring the app is covered in detail in the [getting started guide](https://discord.com/developers/docs/getting-started).

### Setup project

First clone the project:
```
git clone https://github.com/discord/discord-example-app.git
```

Then navigate to its directory and install dependencies:
```
cd discord-example-app
npm install
```
### Get app credentials

Fetch the credentials from your app's settings. Put the app ID (`APP_ID`) and bot token (`DISCORD_TOKEN`) in `.env` for registering commands. The Worker verifies interactions with the public key (`PUBLIC_KEY`), which you configure locally in `.dev.vars` and in Cloudflare as a Worker secret.

Fetching credentials is covered in detail in the [getting started guide](https://discord.com/developers/docs/getting-started).

See `.env.sample` for the command-registration variables. Do not commit `.env` or `.dev.vars`.

### Install slash commands

The built-in commands are set up in `commands.js`. Custom message command names and responses are defined in `custom-commands.json` and converted to Discord command payloads automatically. All commands in the `ALL_COMMANDS` array at the bottom of `commands.js` will be installed when you run the `register` command configured in `package.json`:

```
npm run register
```

### Run locally

Create a `.dev.vars` file containing your Discord public key:

```env
PUBLIC_KEY=your_discord_public_key
```

Start the local Cloudflare Worker:

```
npm run dev
```

To test interactions with Discord during development, expose Wrangler's local port `8787` through an HTTPS tunnel and set the Discord application's **Interactions Endpoint URL** to that URL followed by `/interactions`.

### Deploy to Cloudflare

Log in to Cloudflare and deploy the Worker:

```
npx wrangler login
npm run deploy
```

Set the Discord public key as a Worker secret:

```
npx wrangler secret put PUBLIC_KEY
```

Set the Discord application's **Interactions Endpoint URL** to the deployed Worker URL followed by `/interactions`, for example `https://discord-commands.<your-subdomain>.workers.dev/interactions`.

The Worker handles interactions without storing data between requests, so it does not need a database.

## Other resources
- Read **[the documentation](https://discord.com/developers/docs/intro)** for in-depth information about API features.
- Browse the `examples/` folder in this project for smaller, feature-specific code examples
- Join the **[Discord Developers server](https://discord.gg/discord-developers)** to ask questions about the API, attend events hosted by the Discord API team, and interact with other devs.
- Check out **[community resources](https://discord.com/developers/docs/topics/community-resources#community-resources)** for language-specific tools maintained by community members.
