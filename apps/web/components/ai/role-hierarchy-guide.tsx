"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  GripVertical,
  MousePointer2,
  Plus,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Visual explainer for the most common replace-mode blocker: Discord refuses
 * to let a bot delete roles at or above its own highest role. Administrator
 * does not bypass that, so the only fix is dragging the bot role up.
 *
 * The mock deliberately mirrors Discord's own colours and layout so the user
 * recognises the screen they need to open. A looping "drag" animation shows
 * the bot role moving above the blocked roles.
 */
export function RoleHierarchyGuide({
  guildId,
  className,
}: {
  guildId: string;
  className?: string;
}) {
  const t = useTranslations("ai.apply.roleGuide");

  const listRef = useRef<HTMLDivElement>(null);
  const firstAboveRef = useRef<HTMLDivElement>(null);
  const botRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ top: number; distance: number } | null>(null);

  useEffect(() => {
    const measure = () => {
      if (!firstAboveRef.current || !botRef.current) return;
      const top = botRef.current.offsetTop;
      const height = botRef.current.offsetHeight;
      // Land the floating copy in the slot just above the first blocked role,
      // exactly where the bot has to end up in Discord.
      const target = firstAboveRef.current.offsetTop - height - 2;
      setDrag({ top, distance: target - top });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (listRef.current) observer.observe(listRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const above = [
    { name: t("roleOwner"), color: "#f0b232" },
    { name: t("roleAdmin"), color: "#ed4245" },
    { name: t("roleModerator"), color: "#5865f2" },
  ];

  const botRow = (extra?: string, floating = false) => (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md bg-[#23a55a]/15 px-2 py-2 text-xs font-medium text-[#d7f5e2]",
        extra,
      )}
    >
      <GripVertical className="h-3 w-3 shrink-0 text-[#23a55a]/70" />
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#23a55a]" />
      <span className="min-w-0 flex-1 truncate">{t("roleBot")}</span>
      <span className="shrink-0 rounded bg-[#23a55a]/20 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wide text-[#57f287]">
        {t("botLabel")}
      </span>
      {floating ? (
        <MousePointer2 className="absolute -right-2 -top-2 h-4 w-4 text-white drop-shadow-md" />
      ) : null}
    </div>
  );

  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-[#1e1f22] p-3 text-left shadow-lg shadow-black/20",
        className,
      )}
    >
      <div className="flex items-start gap-2 px-1 pb-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div>
          <p className="text-sm font-semibold text-white">{t("title")}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#b5bac1]">{t("subtitle")}</p>
        </div>
      </div>

      <div className="flex gap-3">
        {/* Discord server rail */}
        <div className="flex w-[52px] shrink-0 flex-col items-center gap-2.5 rounded-xl bg-[#111214] py-3">
          <div className="h-9 w-9 shrink-0 rounded-2xl bg-white/[0.07]" />
          <div className="h-9 w-9 shrink-0 rounded-2xl bg-white/[0.07]" />
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[#23a55a]/15 text-[#23a55a]">
            <Plus className="h-5 w-5" strokeWidth={2.4} />
          </div>
        </div>

        {/* Discord settings panel */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl bg-[#2b2d31]">
          <div className="flex items-center justify-between border-b border-black/20 px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Shield className="h-3.5 w-3.5 text-[#b5bac1]" />
              {t("panelTitle")}
            </div>
            <span className="truncate text-[10px] text-[#949ba4]">{t("panelSubtitle")}</span>
          </div>

          <div ref={listRef} className="relative space-y-0.5 p-2">
            <p className="px-2 pb-1 text-[9px] font-semibold uppercase tracking-wide text-[#ed4245]/80">
              {t("aboveLabel")}
            </p>

            {above.map((role, index) => (
              <div
                key={role.name}
                ref={index === 0 ? firstAboveRef : undefined}
                className="flex items-center gap-2 rounded-md bg-red-500/[0.07] px-2 py-1.5 text-xs text-[#dbdee1]"
              >
                <GripVertical className="h-3 w-3 shrink-0 text-[#949ba4]/40" />
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
                <span className="min-w-0 flex-1 truncate">{role.name}</span>
                <span className="shrink-0 rounded bg-red-500/15 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wide text-red-300">
                  {t("cannotDelete")}
                </span>
              </div>
            ))}

            <div className="role-drag-hint my-1 flex items-center gap-2 rounded-md border border-dashed border-[#f0b232]/50 bg-[#f0b232]/5 px-2 py-1.5">
              <ArrowUp className="h-3.5 w-3.5 shrink-0 text-[#f0b232]" />
              <span className="text-[10px] font-medium text-[#f0b232]">{t("dragHint")}</span>
            </div>

            <div ref={botRef}>{botRow("role-drag-source")}</div>

            {drag ? (
              <div
                aria-hidden
                className="role-drag-clone pointer-events-none absolute inset-x-2 z-20"
                style={
                  {
                    top: `${drag.top}px`,
                    "--role-drag-distance": `${drag.distance}px`,
                  } as CSSProperties
                }
              >
                {botRow(
                  "relative shadow-[0_0_0_1px_rgba(35,165,90,0.55),0_12px_30px_rgba(0,0,0,0.55)]",
                  true,
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#b5bac1]">
              <GripVertical className="h-3 w-3 shrink-0 text-[#949ba4]/30" />
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#99aab5]" />
              <span className="min-w-0 flex-1 truncate">{t("roleMember")}</span>
              <CheckCircle2 className="h-3 w-3 shrink-0 text-[#23a55a]/70" />
            </div>

            <p className="px-2 pt-1 text-[9px] text-[#949ba4]">{t("belowLabel")}</p>
          </div>
        </div>
      </div>

      <ol className="mt-4 space-y-1.5 px-1 text-xs text-[#b5bac1]">
        {[t("step1"), t("step2"), t("step3")].map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#5865f2]/20 text-[9px] font-semibold text-[#c9cdfb]">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap gap-2 px-1">
        <a
          href={`https://discord.com/channels/${guildId}`}
          target="_blank"
          rel="noreferrer"
          className={buttonClasses("secondary", "sm")}
        >
          {t("openDiscord")} <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href="https://support.discord.com/hc/en-us/articles/214836687-Role-Management-101"
          target="_blank"
          rel="noreferrer"
          className={buttonClasses("ghost", "sm")}
        >
          {t("howTo")}
        </a>
      </div>

      <p className="mt-3 px-1 text-[10px] leading-relaxed text-[#949ba4]">{t("note")}</p>
    </div>
  );
}
