# Discord Quest Bot

A Discord bot that automatically completes Discord Quests for users.

## Setup on Railway

1. Fork/clone this repo to your GitHub
2. Go to [railway.app](https://railway.app) and create a new project
3. Select **"Deploy from GitHub repo"** and choose this repo
4. Add environment variables in Railway dashboard:
   - `BOT_TOKEN` — Your Discord Bot Token
   - `CLIENT_ID` — Your Discord Application/Client ID
5. Deploy! Railway will redeploy when new commits reach the connected `main` branch.

## Automatic Railway redeploys

The `.github/workflows/railway-deploy.yml` workflow runs after every push to
`main`. To enable it with a Railway deploy hook:

1. In Railway, open the service settings and create a **Deploy Hook**.
2. In GitHub, open **Settings → Secrets and variables → Actions**.
3. Create a repository secret named `RAILWAY_DEPLOY_HOOK_URL` and paste the
   deploy hook URL there.

The workflow skips safely until that secret exists. If Railway is already
connected directly to this repository, Railway's native GitHub integration is
enough and this hook is optional.

The separate validation workflow checks TypeScript on every push. It does not
start a long-running bot process inside GitHub Actions.

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

> Warning: this project currently uses user tokens for quest completion. That
> can put an account at risk and may violate Discord's Terms of Service.
