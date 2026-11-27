"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bell, ChevronDown, Coins, LogOut, ShieldCheck, UserRound } from "lucide-react";
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
  balance: string;
  unread: number;
  notifications: NotificationItem[];
  user: { name: string; username: string; avatar: string };
  isAdmin: boolean;
}

export function TopbarClient({
  balance,
  unread,
  notifications,
  user,
  isAdmin,
}: TopbarClientProps) {
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
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/dashboard/billing"
        className="mono-label focus-ring inline-flex min-h-[40px] items-center gap-2 rounded-pill px-2 text-chalk-400 transition-colors hover:bg-white/[0.04] hover:text-white motion-reduce:transition-none lg:hidden"
        title={t("creditsLeft")}
      >
        <Coins className="h-3.5 w-3.5 text-spark-300" aria-hidden="true" />
        <span className="tabular-nums">{balance}</span>
      </Link>

      <div className="relative">
        <details className="group">
          <summary
            className="focus-ring flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-pill border border-wire text-chalk-400 transition-colors hover:bg-white/[0.04] hover:text-chalk motion-reduce:transition-none"
            aria-label={t("notifications")}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {localUnread > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-pill bg-spark-500 px-1 text-[10px] leading-none text-white">
                {localUnread}
              </span>
            ) : null}
          </summary>
          <div className="menu-panel absolute right-0 top-12 w-80 overflow-hidden">
            <div className="flex items-center justify-between border-b border-wire px-4 py-3">
              <p className="mono-label text-chalk-300">{t("notifications")}</p>
              {localUnread > 0 ? (
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={pending}
                  className="focus-ring mono-label rounded-control text-chalk-500 transition-colors hover:text-chalk disabled:opacity-50"
                >
                  {t("markRead")}
                </button>
              ) : null}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-[13px] text-chalk-500">
                  {t("noNotifications")}
                </p>
              ) : (
                notifications.map((notification) => {
                  const content = (
                    <div
                      className={cn(
                        "border-b border-wire px-4 py-3 last:border-0 transition-colors hover:bg-void-800",
                        !notification.read && "bg-spark-300/[0.04]",
                      )}
                    >
                      <p className="text-[13px] leading-snug text-chalk">{notification.title}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-chalk-500">
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

      <div className="relative">
        <details className="group">
          <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 rounded-pill border border-wire py-1 pl-1 pr-2 transition-colors hover:bg-white/[0.04] motion-reduce:transition-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={user.avatar} alt="" className="h-7 w-7 rounded-pill" />
            <span className="mono-label hidden max-w-24 truncate text-chalk-300 sm:inline">
              {user.name}
            </span>
            <ChevronDown className="h-3 w-3 text-chalk-500" aria-hidden="true" />
          </summary>
          <div className="menu-panel absolute right-0 top-12 w-60 overflow-hidden">
            <div className="border-b border-wire px-4 py-3">
              <p className="truncate text-sm text-chalk">{user.name}</p>
              <p className="truncate text-[12px] text-chalk-500">@{user.username}</p>
            </div>
            <Link href="/dashboard/servers" className="menu-item">
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" /> {t("title")}
            </Link>
            <Link href="/dashboard/billing" className="menu-item">
              <Coins className="h-3.5 w-3.5" aria-hidden="true" /> {tc("credits")}
            </Link>
            {isAdmin ? (
              <Link href="/dashboard/admin" className="menu-item">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> {t("admin")}
              </Link>
            ) : null}
            <a
              href="/api/auth/logout"
              className="menu-item border-t border-wire text-red-300 hover:bg-red-400/10 hover:text-red-200"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> {tc("signOut")}
            </a>
          </div>
        </details>
      </div>
    </div>
  );
}
