"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Blocks, Home, Server, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function GuildSidebar({
  guildId,
  guildName,
  guildIcon,
}: {
  guildId: string;
  guildName: string;
  guildIcon: string | null;
}) {
  const pathname = usePathname();
  const t = useTranslations("dashboard.nav");
  const tc = useTranslations("common");
  const items = [
    { href: `/dashboard/${guildId}`, label: t("home"), icon: Home, exact: true },
    { href: `/dashboard/${guildId}/ai/new`, label: t("ai"), icon: Sparkles, match: "/ai" },
    { href: `/dashboard/${guildId}/modules`, label: t("modules"), icon: Blocks, match: "/modules", soon: true },
    { href: `/dashboard/${guildId}/server`, label: t("server"), icon: Server, match: "/server" },
  ];

  return (
    <aside className="space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-spark-100/45 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("backToServers")}
      </Link>
      <div className="surface-muted flex items-center gap-2.5 p-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-ink-800">
          {guildIcon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={guildIcon} alt="" className="h-full w-full object-cover" />
          ) : (
            <Server className="h-4 w-4 text-spark-300" />
          )}
        </div>
        <p className="min-w-0 flex-1 truncate text-xs font-medium text-white">{guildName}</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.includes(item.match ?? item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors",
                active
                  ? "bg-spark-500/15 text-white"
                  : "text-spark-100/55 hover:bg-ink-800/60 hover:text-white",
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span className="flex-1">{item.label}</span>
              {item.soon ? <Badge variant="soon">{tc("comingSoon")}</Badge> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
