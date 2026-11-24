"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bell, ChevronDown, Coins, LogOut, Sparkles, UserRound } from "lucide-react";
import { LocaleSwitcher } from "./locale-switcher";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

interface TopbarClientProps {
  balance: number;
  unread: number;
  notifications: NotificationItem[];
  user: { name: string; username: string; avatar: string };
  locale: "cs" | "en";
}

export function TopbarClient({ balance, unread, notifications, user, locale }: TopbarClientProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localUnread, setLocalUnread] = useState(unread);

  function markAllRead() {
    startTransition(async () => {
      await fetch("/api/notifications/read", { method: "POST" });
      setLocalUnread(0);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/dashboard/billing"
        className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-900 px-3 py-1.5 text-xs text-spark-100/80 transition-colors hover:border-spark-500/40 hover:text-white"
        title={t("creditsLeft")}
      >
        <Coins className="h-3.5 w-3.5 text-spark-300" />
        <span className="font-semibold text-white">{balance.toLocaleString("cs-CZ")}</span>
        <span className="hidden sm:inline">{tc("credits")}</span>
      </Link>

      <Link
        href="/dashboard/billing"
        className="focus-ring hidden items-center gap-1.5 rounded-full border border-spark-500/30 bg-spark-500/10 px-3 py-1.5 text-xs font-medium text-spark-200 transition-colors hover:bg-spark-500/20 sm:inline-flex"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {t("offers")}
      </Link>

      <div className="relative">
        <details className="group">
          <summary
            className="focus-ring flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-line bg-ink-900 text-spark-100/70 hover:text-white"
            aria-label={t("notifications")}
          >
            <Bell className="h-4 w-4" />
            {localUnread > 0 ? (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-spark-500 px-1 text-[9px] font-bold text-white">
                {localUnread}
              </span>
            ) : null}
          </summary>
          <div className="absolute right-0 top-11 w-80 overflow-hidden rounded-xl border border-line bg-ink-850 shadow-card">
            <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
              <p className="text-sm font-medium text-white">{t("notifications")}</p>
              {localUnread > 0 ? (
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={pending}
                  className="text-[11px] text-spark-300 hover:text-spark-200 disabled:opacity-50"
                >
                  {t("markRead")}
                </button>
              ) : null}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-spark-100/40">{t("noNotifications")}</p>
              ) : (
                notifications.map((notification) => {
                  const content = (
                    <div
                      className={cn(
                        "border-b border-line/40 px-4 py-3 last:border-0 hover:bg-ink-800/60",
                        !notification.read && "bg-spark-500/[0.04]",
                      )}
                    >
                      <p className="text-xs font-medium text-white">{notification.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-spark-100/50">
                        {notification.body}
                      </p>
                    </div>
                  );
                  return notification.href ? (
                    <Link key={notification.id} href={notification.href} className="block">
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id}>{content}</div>
                  );
                })
              )}
            </div>
          </div>
        </details>
      </div>

      <LocaleSwitcher current={locale} compact />

      <div className="relative">
        <details className="group">
          <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 rounded-full border border-line bg-ink-900 py-1 pl-1 pr-2.5 hover:border-spark-500/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={user.avatar} alt="" className="h-7 w-7 rounded-full" />
            <span className="hidden max-w-24 truncate text-xs text-spark-100/80 sm:inline">
              {user.name}
            </span>
            <ChevronDown className="h-3 w-3 text-spark-100/40" />
          </summary>
          <div className="absolute right-0 top-11 w-56 overflow-hidden rounded-xl border border-line bg-ink-850 shadow-card">
            <div className="border-b border-line/60 px-4 py-3">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-spark-100/40">@{user.username}</p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2.5 text-xs text-spark-100/70 hover:bg-ink-800 hover:text-white"
            >
              <UserRound className="h-3.5 w-3.5" /> {t("title")}
            </Link>
            <Link
              href="/dashboard/billing"
              className="flex items-center gap-2 px-4 py-2.5 text-xs text-spark-100/70 hover:bg-ink-800 hover:text-white"
            >
              <Coins className="h-3.5 w-3.5" /> {tc("credits")}
            </Link>
            <a
              href="/api/auth/logout"
              className="flex items-center gap-2 border-t border-line/50 px-4 py-2.5 text-xs text-red-300 hover:bg-ink-800"
            >
              <LogOut className="h-3.5 w-3.5" /> {tc("signOut")}
            </a>
          </div>
        </details>
      </div>
    </div>
  );
}
