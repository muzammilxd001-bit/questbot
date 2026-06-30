import {
  GatewayDispatchEvents,
  GatewayIntentBits,
  InteractionType,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ComponentType,
  ButtonStyle,
  TextInputStyle,
} from "discord-api-types/v10";
import { Client } from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import { runQuestsForToken, fetchQuestsStatus } from "./src/questRunner";
import type { Quest, QuestStatusInfo } from "./src/questRunner";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is required.");
  process.exit(1);
}

if (!CLIENT_ID) {
  console.error("CLIENT_ID is required.");
  process.exit(1);
}

const PREFIX = "!quest";

const INTENTS =
  GatewayIntentBits.Guilds |
  GatewayIntentBits.GuildMessages |
  GatewayIntentBits.MessageContent |
  GatewayIntentBits.DirectMessages;

const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
const gateway = new WebSocketManager({
  token: BOT_TOKEN,
  intents: INTENTS,
  rest,
});
const client = new Client({ rest, gateway });

const BTN_RUN = "quest_run_btn";
const BTN_STATUS = "quest_status_btn";
const MODAL_RUN = "quest_run_modal";
const MODAL_STATUS = "quest_status_modal";
const INPUT_TOKEN = "user_token_input";

const TASK_LABELS: Record<string, string> = {
  WATCH_VIDEO: "ðŸ“º Watch Video",
  WATCH_VIDEO_ON_MOBILE: "ðŸ“± Watch Video on Mobile",
  PLAY_ON_DESKTOP: "ðŸ–¥ï¸ Play on Desktop",
  PLAY_ON_XBOX: "ðŸŽ® Play on Xbox",
  PLAY_ON_PLAYSTATION: "ðŸŽ® Play on PlayStation",
  PLAY_ACTIVITY: "ðŸŽ¯ Play Activity",
  ACHIEVEMENT_IN_ACTIVITY: "ðŸ† Achievement",
  STREAM_ON_DESKTOP: "ðŸ“¡ Stream on Desktop",
};

function makeBar(pct: number, len = 12): string {
  const filled = Math.round((pct / 100) * len);
  return "â–ˆ".repeat(filled) + "â–‘".repeat(len - filled);
}


function buildTokenRequiredEmbed() {
  return {
    title: "Quest Bot",
    description:
      "Please provide your user token so I can check and complete your quests.",
    color: 0xffc107,
    fields: [
      {
        name: "How to use",
        value: "Click the button below, paste your token, and submit.",
      },
      {
        name: "Security note",
        value: "Your token is only used to fetch quest info and run tasks.",
      },
    ],
  };
}

function buildTokenModal() {
  return {
    title: "Enter Token",
    custom_id: MODAL_RUN,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.TextInput,
            custom_id: INPUT_TOKEN,
            label: "User Token",
            style: TextInputStyle.Short,
            required: true,
            placeholder: "Paste your token here",
          },
        ],
      },
    ],
  };
}

function buildCompleteEmbed(task: Quest) {
  return {
    title: "Quest Completed",
    description: `Finished: ${TASK_LABELS[task.task_type] ?? task.task_type}`,
    color: 0x57f287,
  };
}

function buildStatusEmbed(status: QuestStatusInfo) {
  return {
    title: "Quest Status",
    description: `Progress: ${status.progress}%`,
    color: 0x5865f2,
    fields: [
      {
        name: "Bar",
        value: makeBar(status.progress),
      },
    ],
  };
}

function buildTokenModal(customId: string, title: string) {
  return {
    title,
    custom_id: customId,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.TextInput,
            style: TextInputStyle.Short,
            custom_id: INPUT_TOKEN,
            label: "Your Discord user token",
            placeholder: "Paste your token here — it starts with your ID",
            required: true,
            min_length: 20,
          },
        ],
      },
    ],
  };
}

function buildCompleteEmbed(quest: Quest) {
  const cfg = quest.config;
  const questName = cfg.messages.quest_name;
  const gameTitle = cfg.messages.game_title;
  const publisher = cfg.messages.game_publisher;
  const appId = cfg.application.id;

  const color =
    parseInt((cfg.colors?.primary ?? "#5865F2").replace("#", ""), 16) ||
    0x5865f2;

  const tasks = cfg.task_config_v2?.tasks ?? {};
  const taskLines = Object.entries(tasks)
    .map(([k, v]: [string, any]) => {
      const mins = Math.ceil((v?.target ?? 0) / 60);
      return `• ${TASK_LABELS[k] ?? k} (${mins} min)`;
    })
    .join("\n");

  const expiresAt = new Date(cfg.expires_at);
  const expiresUnix = Math.floor(expiresAt.getTime() / 1000);

  const rewards = cfg.rewards_config?.rewards ?? [];
  const rewardLines = (rewards as any[])
    .map((r: any) =>
      r.orb_quantity
        ? `• ${r.orb_quantity} Orbs ✦ (${r.messages?.name ?? "Reward"})`
        : `• ${r.messages?.name ?? "Reward"}`,
    )
    .join("\n");

  const gameTile = cfg.assets?.game_tile;
  const bannerUrl = gameTile
    ? `https://media.discordapp.net/app-assets/${appId}/store/${gameTile}.png`
    : null;

  return {
    color,
    author: {
      name: "Quest Completed",
      icon_url: "https://cdn.discordapp.com/emojis/1061639553152372786.png",
    },
    title: `✅ ${questName}`,
    description: `**${gameTitle}**\n*${publisher}*`,
    image: bannerUrl ? { url: bannerUrl } : undefined,
    fields: [
      {
        name: "Quest Info",
        value:
          `**Expires:** <t:${expiresUnix}:D>\n` +
          `**Game:** ${gameTitle}\n` +
          `**Application:** ${gameTitle}\n` +
          `**Status:** Completed`,
        inline: false,
      },
      {
        name: "Tasks",
        value: taskLines || "• No task info available",
        inline: false,
      },
      {
        name: "Reward",
        value: rewardLines || "• No reward listed",
        inline: false,
      },
    ],
    footer: {
      text: "Quest finished successfully",
    },
    timestamp: new Date().toISOString(),
  };
}

function buildStatusEmbed(info: QuestStatusInfo) {
  const color = parseInt(info.colorHex, 16) || 0x5865f2;
  const taskLabel = TASK_LABELS[info.taskName] ?? info.taskName;
  const targetMins = Math.ceil(info.targetSeconds / 60);
  const doneMins = Math.ceil(info.doneSeconds / 60);
  const expiresUnix = Math.floor(info.expiresAt.getTime() / 1000);

  const statusText = info.isCompleted
    ? "Completed"
    : info.isEnrolled
      ? "In Progress"
      : "Not Enrolled";

  const rewardText = info.orbQuantity
    ? `• ${info.orbQuantity} Orbs ✦ (${info.rewardName})`
    : `• ${info.rewardName}`;

  const bannerUrl = info.gameTileAsset
    ? `https://media.discordapp.net/app-assets/${info.appId}/store/${info.gameTileAsset}.png`
    : null;

  return {
    color,
    author: {
      name: "New Quest Available",
      icon_url: "https://cdn.discordapp.com/emojis/1061639553152372786.png",
    },
    title: `Play ${info.gameTitle}`,
    description: `**${info.name}**`,
    image: bannerUrl ? { url: bannerUrl } : undefined,
    fields: [
      {
        name: "Quest Info",
        value:
          `**Duration:** <t:${expiresUnix}:D>\n` +
          `**Redeemable Platforms:** Cross Platform\n` +
          `**Game:** ${info.gameTitle}\n` +
          `**Application:** ${info.gameTitle}\n` +
          `**Status:** ${statusText}`,
        inline: false,
      },
      {
        name: "Tasks",
        value:
          `User must complete the following task:\n` +
          `• ${taskLabel} (${targetMins} minutes)\n` +
          `• Progress: ${doneMins}/${targetMins} minutes (${info.progressPct}%)\n` +
          `• ${makeBar(info.progressPct)} ${info.progressPct}%`,
        inline: false,
      },
      {
        name: "Reward",
        value: rewardText || "• No reward listed",
        inline: false,
      },
    ],
    footer: {
      text: "Quest status preview",
    },
    timestamp: new Date().toISOString(),
  };
}
