export interface UserRow {
  id: string;
  discord_id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  locale: "cs" | "en";
  plan: "free" | "starter" | "premium" | "pro";
  plan_interval: "month" | "year" | null;
  plan_renews_at: string | null;
  stripe_customer_id: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuildRow {
  id: string;
  name: string;
  icon: string | null;
  owner_discord_id: string | null;
  bot_present: boolean;
  bot_present_checked_at: string | null;
  locale: "cs" | "en";
  created_at: string;
  updated_at: string;
}

export interface GuildMemberRow {
  guild_id: string;
  user_id: string;
  permissions: string;
  is_owner: boolean;
  synced_at: string;
}

export interface BlueprintRow {
  id: string;
  user_id: string;
  guild_id: string;
  title: string;
  prompt: string;
  data: import("@ohnivo/shared").ServerBlueprint;
  issues: import("@ohnivo/shared").BlueprintIssue[];
  removed_permissions: import("@ohnivo/shared").RemovedPermission[];
  revision: number;
  status: "draft" | "queued" | "applied" | "archived";
  created_at: string;
  updated_at: string;
}

export interface ApplyJobRow {
  id: string;
  user_id: string;
  guild_id: string;
  blueprint_id: string;
  blueprint_revision: number;
  blueprint_snapshot: import("@ohnivo/shared").ServerBlueprint;
  mode: import("@ohnivo/shared").ApplyMode;
  status: import("@ohnivo/shared").ApplyJobStatus;
  progress: import("@ohnivo/shared").ApplyProgressEntry[];
  summary: Record<string, number>;
  cost: number;
  refunded: boolean;
  error: string | null;
  attempts: number;
  locked_by: string | null;
  locked_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditLedgerRow {
  id: number;
  user_id: string;
  delta: number;
  kind: string;
  meta: Record<string, unknown>;
  balance_after: number;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  discord_access_token: string;
  discord_refresh_token: string | null;
  discord_token_expires_at: string | null;
  expires_at: string;
  created_at: string;
  last_seen_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: "starter" | "premium" | "pro";
  interval: "month" | "year";
  status: string;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}
