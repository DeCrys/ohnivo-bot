import { z } from "zod";

/**
 * NVIDIA NIM model used when NVIDIA_MODEL is not set. Must be a model the key
 * actually has access to; older names (e.g. meta/llama-3.1-8b-instant) return
 * 404 or are end-of-life.
 */
export const DEFAULT_NVIDIA_MODEL = "nvidia/nemotron-3.5-bolt-e4b";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_JWT_SECRET: z.string().min(1).optional(),
  DISCORD_CLIENT_ID: z.string().min(1).optional(),
  DISCORD_CLIENT_SECRET: z.string().min(1).optional(),
  DISCORD_BOT_TOKEN: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(16).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-4-5"),
  NVIDIA_API_KEY: z.string().min(1).optional(),
  NVIDIA_MODEL: z.string().min(1).default(DEFAULT_NVIDIA_MODEL),
  AI_PROVIDER: z.enum(["auto", "anthropic", "nvidia", "mock"]).default("auto"),
  ADMIN_DISCORD_IDS: z.string().optional(),
  DEV_ADMIN_ENABLED: z.enum(["true", "false"]).default("false"),
  AI_RATE_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(20),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_STARTER_MONTH: z.string().optional(),
  STRIPE_PRICE_STARTER_YEAR: z.string().optional(),
  STRIPE_PRICE_PREMIUM_MONTH: z.string().optional(),
  STRIPE_PRICE_PREMIUM_YEAR: z.string().optional(),
  STRIPE_PRICE_PRO_MONTH: z.string().optional(),
  STRIPE_PRICE_PRO_YEAR: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n${details.join("\n")}`);
  }
  return parsed.data;
}

export const env = loadEnv();

export class ConfigError extends Error {
  constructor(public readonly variable: string) {
    super(`Missing required environment variable: ${variable}`);
    this.name = "ConfigError";
  }
}

export function requireEnv(name: keyof Env | string): string {
  const value = (env as Record<string, unknown>)[name] ?? process.env[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new ConfigError(name);
  }
  return value;
}

export function hasSupabase(): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isAiConfigured(): boolean {
  const hasAnthropic = Boolean(env.ANTHROPIC_API_KEY);
  const hasNvidia = Boolean(env.NVIDIA_API_KEY);
  // also allow key read from file in provider
  return (hasAnthropic || hasNvidia) && env.AI_PROVIDER !== "mock";
}

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function appUrl(): string {
  return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}
