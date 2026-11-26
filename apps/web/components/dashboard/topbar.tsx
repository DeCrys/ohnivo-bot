import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BRAND } from "@ohnivo/shared";
import { requireUser } from "@/lib/auth/session";
import { isAdminUser } from "@/lib/auth/admin";
import { getCreditBalance } from "@/lib/credits";
import { avatarUrl } from "@/lib/discord";
import { getServiceClient } from "@/lib/supabase/service";
import type { NotificationRow } from "@/lib/types";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/dashboard/locale-switcher";
import { TopbarClient } from "./topbar-client";

const NAV = [
  { href: "/dashboard", key: "servers" },
  { href: "/dashboard/new", key: "new" },
  { href: "/dashboard/billing", key: "billing" },
] as const;

export async function Topbar() {
  const session = await requireUser();
  const t = await getTranslations("dashboard");
  const tn = await getTranslations("dashboard.nav");
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
  const balanceLabel = new Intl.NumberFormat(locale).format(balance);

  return (
    <>
      {/* Meta bar: panel label, domain, credit balance. Scrolls away. */}
      <div className="frame">
        <div className="pad hidden h-9 items-center justify-between gap-6 lg:flex">
          <p className="mono-label">{t("panelLabel")}</p>
          <p className="mono-label text-chalk-500">{BRAND.domain}</p>
          <Link
            href="/dashboard/billing"
            className="mono-label focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-control text-chalk-300 transition-colors hover:text-chalk motion-reduce:transition-none"
          >
            <span className="h-1.5 w-1.5 rounded-pill bg-spark-300" aria-hidden="true" />
            <span className="text-chalk-500">{t("creditsLeft")}</span>
            <span className="tabular-nums">{balanceLabel}</span>
          </Link>
        </div>
        <nav aria-label={tn("sections")} className="carousel-fade pad flex items-center gap-5 overflow-x-auto lg:hidden">
          {NAV.map((link, index) => (
            <Link
              key={link.key}
              href={link.href}
              className="mono-label focus-ring inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-pill border border-wire px-3.5 text-chalk-300 transition-colors hover:bg-white/[0.04] hover:text-chalk motion-reduce:transition-none"
            >
              <span className="text-chalk-500">{String(index + 1).padStart(2, "0")}</span>
              {tn(link.key)}
            </Link>
          ))}
        </nav>
      </div>

      <header className="sticky top-0 z-40">
        <div className="frame border-b border-wire bg-void/85 backdrop-blur-md">
          <div className="pad flex h-16 items-center justify-between gap-4">
            <Logo />

            <nav aria-label={tn("sections")} className="hidden items-center gap-8 lg:flex">
              {NAV.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className="mono-label focus-ring inline-flex min-h-[44px] items-center rounded-pill border border-wire px-4 text-chalk-300 transition-colors hover:bg-white/[0.04] hover:text-chalk motion-reduce:transition-none"
                >
                  {tn(link.key)}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <LocaleSwitcher current={locale as "cs" | "en"} compact />
              <TopbarClient
                balance={balanceLabel}
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
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
