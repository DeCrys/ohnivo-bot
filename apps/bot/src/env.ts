import { z } from "zod";

const schema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DISCORD_BOT_TOKEN: z.string().min(1),
  WORKER_NAME: z.string().min(1).optional(),
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2500),
  PRESENCE_SYNC_MS: z.coerce.number().int().positive().default(5 * 60 * 1000),
});

function load() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Invalid bot environment:\n${details.join("\n")}`);
  }
  const data = parsed.data;
  const url = data.SUPABASE_URL ?? data.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) for the bot");
  }
  return {
    supabaseUrl: url,
    supabaseServiceRoleKey: data.SUPABASE_SERVICE_ROLE_KEY,
    discordToken: data.DISCORD_BOT_TOKEN,
    workerName: data.WORKER_NAME ?? `ohnivo-bot-${process.pid}`,
    pollIntervalMs: data.POLL_INTERVAL_MS,
    presenceSyncMs: data.PRESENCE_SYNC_MS,
  };
}

export const botEnv = load();
