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
  const ta = useTranslations("ai.hub");
  const tc = useTranslations("common");
  const aiBase = `/dashboard/${guildId}/ai`;
  const items = [
    { href: `/dashboard/${guildId}`, label: t("home"), icon: Home, exact: true },
    { href: aiBase, label: t("ai"), icon: Sparkles, match: "/ai", ai: true },
    { href: `/dashboard/${guildId}/modules`, label: t("modules"), icon: Blocks, match: "/modules", soon: true },
    { href: `/dashboard/${guildId}/server`, label: t("server"), icon: Server, match: "/server" },
  ];
  const aiItems = [
    {
      href: `${aiBase}/new`,
      label: ta("createTitle"),
      active: pathname === `${aiBase}/new`,
    },
    {
      href: `${aiBase}#recent-drafts`,
      label: ta("editTitle"),
      active: pathname.startsWith(`${aiBase}/`) && pathname !== `${aiBase}/new`,
    },
    { href: `${aiBase}#creative-studio`, label: ta("creativeTitle"), active: false },
    { href: `${aiBase}#restyle-server`, label: ta("restyleTitle"), active: false },
    { href: `${aiBase}#module-workshop`, label: ta("workshopTitle"), active: false },
  ];

  return (
    <aside className="space-y-5">
      <Link
        href="/dashboard/servers"
        className="mono-label focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-control text-chalk-500 transition-colors hover:text-chalk motion-reduce:transition-none"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {t("backToServers")}
      </Link>

      <div className="panel flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-inner border border-wire bg-void-800">
          {guildIcon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={guildIcon} alt="" className="h-full w-full object-cover" />
          ) : (
            <Server className="h-4 w-4 text-spark-300" aria-hidden="true" />
          )}
        </div>
        <p className="min-w-0 flex-1 truncate text-[14px] font-medium text-white">{guildName}</p>
      </div>

      <nav className="space-y-1">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.includes(item.match ?? item.href);
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "focus-ring flex min-h-[44px] items-center gap-3 rounded-control px-3 text-[13px] transition-colors duration-150 motion-reduce:transition-none",
                  active
                    ? "bg-white/[0.05] text-white"
                    : "text-chalk-500 hover:bg-white/[0.03] hover:text-white",
                )}
              >
                <span
                  className={cn("h-1.5 w-1.5 rounded-pill", active ? "bg-spark-300" : "bg-wire-strong")}
                  aria-hidden="true"
                />
                <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {item.soon ? <Badge variant="soon">{tc("comingSoon")}</Badge> : null}
              </Link>
              {item.ai && active ? (
                <div className="space-y-0.5 py-1 pl-5">
                  {aiItems.map((aiItem) => (
                    <Link
                      key={aiItem.href}
                      href={aiItem.href}
                      className={cn(
                        "focus-ring flex min-h-[36px] items-center rounded-control px-3 text-[13px] transition-colors duration-150 motion-reduce:transition-none",
                        aiItem.active
                          ? "bg-white/[0.05] text-spark-200"
                          : "text-chalk-500 hover:bg-white/[0.03] hover:text-white",
                      )}
                    >
                      {aiItem.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
