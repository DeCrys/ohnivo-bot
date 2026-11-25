import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { isAdminUser } from "@/lib/auth/admin";
import { getCreditBalance } from "@/lib/credits";
import { avatarUrl } from "@/lib/discord";
import { getServiceClient } from "@/lib/supabase/service";
import type { NotificationRow } from "@/lib/types";
import { TopbarClient } from "./topbar-client";

export async function Topbar() {
  const session = await requireUser();
  const t = await getTranslations("dashboard");
  const locale = await getLocale();

  const [balance, notificationsResult] = await Promise.all([
    getCreditBalance(session.user.id).catch(() => 0),
    getServiceClient()
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const notifications = (notificationsResult.data ?? []) as NotificationRow[];
  const unread = notifications.filter((notification) => !notification.read_at).length;

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight text-white">
            ohnivo<span className="text-spark-400">.</span>
          </Link>
          <span className="hidden text-xs text-spark-100/35 sm:inline">/ {t("title")}</span>
        </div>

        <TopbarClient
          balance={balance}
          unread={unread}
          notifications={notifications.map((notification) => ({
            id: notification.id,
            title: notification.title,
            body: notification.body,
            href: notification.href,
            read: Boolean(notification.read_at),
            createdAt: notification.created_at,
          }))}
          user={{
            name: session.user.global_name ?? session.user.username,
            username: session.user.username,
            avatar: avatarUrl(session.user.discord_id, session.user.avatar),
          }}
          isAdmin={isAdminUser(session.user)}
          locale={locale as "cs" | "en"}
        />
      </div>
    </header>
  );
}
