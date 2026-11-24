import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { runJob } from "./apply.js";
import { botEnv } from "./env.js";
import { logger } from "./logger.js";
import { markGuildAbsent, markGuildPresent, syncPresence } from "./presence.js";
import { claimJob } from "./queue.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let busy = false;
let queueTimer: NodeJS.Timeout | null = null;
let presenceTimer: NodeJS.Timeout | null = null;

async function tick(): Promise<void> {
  if (busy) return;
  busy = true;
  try {
    const job = await claimJob(botEnv.workerName);
    if (job) {
      await runJob(client, job);
    }
  } catch (error) {
    logger.error("Queue tick failed", error);
  } finally {
    busy = false;
    queueTimer = setTimeout(() => void tick(), botEnv.pollIntervalMs);
  }
}

client.once(Events.ClientReady, (ready) => {
  logger.info(`Logged in as ${ready.user.tag}`, {
    guilds: ready.guilds.cache.size,
    worker: botEnv.workerName,
  });
  void syncPresence(ready);
  queueTimer = setTimeout(() => void tick(), 750);
  presenceTimer = setInterval(() => void syncPresence(ready), botEnv.presenceSyncMs);
});

client.on(Events.GuildCreate, (guild) => {
  logger.info(`Joined guild ${guild.name} (${guild.id})`);
  void markGuildPresent(guild);
});

client.on(Events.GuildDelete, (guild) => {
  logger.info(`Removed from guild ${guild.id}`);
  void markGuildAbsent(guild.id);
});

client.on(Events.Error, (error) => {
  logger.error("Discord client error", error);
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down`);
  if (queueTimer) clearTimeout(queueTimer);
  if (presenceTimer) clearInterval(presenceTimer);
  await client.destroy();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", reason);
});
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", error);
});

client.login(botEnv.discordToken).catch((error) => {
  logger.error("Discord login failed", error);
  process.exit(1);
});
