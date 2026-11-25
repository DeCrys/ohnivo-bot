import { isPaidPlan } from "@ohnivo/shared";
import { env } from "../env";
import type { UserRow } from "../types";

type AdminUser = Pick<UserRow, "discord_id" | "is_admin" | "plan">;

export function isAdminUser(user: Pick<AdminUser, "discord_id" | "is_admin">): boolean {
  const allowedDiscordIds = new Set(
    (env.ADMIN_DISCORD_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
  const appHost = new URL(env.NEXT_PUBLIC_APP_URL).hostname;
  const isLocalDev =
    env.NODE_ENV === "development" &&
    env.DEV_ADMIN_ENABLED === "true" &&
    ["localhost", "127.0.0.1", "::1"].includes(appHost);

  return user.is_admin || allowedDiscordIds.has(user.discord_id) || isLocalDev;
}

export function canUsePaidAi(user: AdminUser): boolean {
  return isPaidPlan(user.plan) || isAdminUser(user);
}
