# Discord Quest Bot 🎮

A Discord bot that automatically completes Discord Quests for users.

## Setup on Railway

1. Fork/clone this repo to your GitHub
2. Go to [railway.app](https://railway.app) and create a new project
3. Select **"Deploy from GitHub repo"** and choose this repo
4. Add environment variables in Railway dashboard:
   - `BOT_TOKEN` — Your Discord Bot Token
   - `CLIENT_ID` — Your Discord Application/Client ID
5. Deploy!

## Bot Commands

- `/run-quests` — Auto-complete your Discord quests (requires your user token)
- `/quest-status` — Check your active quests and progress
- `!quest` — Show the button menu

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `BOT_TOKEN` | ✅ | Discord Bot Token (from Discord Developer Portal) |
| `CLIENT_ID` | ✅ | Discord Application Client ID |

## Getting BOT_TOKEN and CLIENT_ID

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application → "Bot" section → copy the token
3. Copy the Application ID from the General Information page

> ⚠️ This project uses user tokens for quest completion — use at your own risk as it may violate Discord TOS.
