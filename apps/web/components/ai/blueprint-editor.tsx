"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Hash,
  Megaphone,
  MessagesSquare,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Volume2,
  Wand2,
} from "lucide-react";
import type {
  BlueprintIssue,
  ChannelType,
  RemovedPermission,
  ServerBlueprint,
} from "@ohnivo/shared";
import { LIMITS } from "@ohnivo/shared";
import { Button } from "@/components/ui/button";
import { Badge, Alert } from "@/components/ui/primitives";
import { Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface BlueprintEditorProps {
  guildId: string;
  blueprintId: string;
  initial: ServerBlueprint;
  initialIssues: BlueprintIssue[];
  initialRemoved: RemovedPermission[];
  refineCost: number;
  regenerateCost: number;
  canUseAi: boolean;
  balance: number;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const CHANNEL_TYPES: ChannelType[] = ["text", "voice", "forum", "announcement"];

function channelIcon(type: ChannelType) {
  if (type === "voice") return Volume2;
  if (type === "forum") return MessagesSquare;
  if (type === "announcement") return Megaphone;
  return Hash;
}

export function BlueprintEditor({
  guildId,
  blueprintId,
  initial,
  initialIssues,
  initialRemoved,
  refineCost,
  regenerateCost,
  canUseAi,
  balance,
}: BlueprintEditorProps) {
  const t = useTranslations("ai.preview");
  const tc = useTranslations("common");
  const te = useTranslations("ai.errors");
  const router = useRouter();

  const [draft, setDraft] = useState<ServerBlueprint>(initial);
  const [issues, setIssues] = useState<BlueprintIssue[]>(initialIssues);
  const [removed, setRemoved] = useState<RemovedPermission[]>(initialRemoved);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [dirty, setDirty] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [action, setAction] = useState<"refine" | "regenerate" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const mounted = useRef(false);

  function update(mutator: (next: ServerBlueprint) => void) {
    setDraft((current) => {
      const next = structuredClone(current);
      mutator(next);
      return next;
    });
    setDirty(true);
    setActionSuccess(null);
  }

  async function save(current: ServerBlueprint): Promise<boolean> {
    setStatus("saving");
    try {
      const response = await fetch(`/api/blueprints/${blueprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprint: current }),
      });
      const data = (await response.json()) as {
        blueprint?: ServerBlueprint;
        issues?: BlueprintIssue[];
        removedPermissions?: RemovedPermission[];
        error?: { code: string };
      };
      if (!response.ok) {
        setStatus("error");
        return false;
      }
      if (data.issues) setIssues(data.issues);
      if (data.removedPermissions) setRemoved(data.removedPermissions);
      setStatus("saved");
      setDirty(false);
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!dirty) return;
    const timer = setTimeout(() => {
      void save(draft);
    }, 1100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, dirty]);

  function errorMessage(code: string | undefined): string {
    try {
      return te(code ?? "unknown");
    } catch {
      return te("unknown");
    }
  }

  async function runAction(kind: "refine" | "regenerate") {
    setAction(kind);
    setActionError(null);
    setActionSuccess(null);
    try {
      const response = await fetch(
        kind === "refine" ? "/api/ai/refine" : "/api/ai/regenerate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            kind === "refine" ? { blueprintId, instruction: refineText } : { blueprintId },
          ),
        },
      );
      const data = (await response.json()) as {
        blueprint?: ServerBlueprint;
        issues?: BlueprintIssue[];
        removedPermissions?: RemovedPermission[];
        error?: { code: string };
      };
      if (!response.ok || !data.blueprint) {
        setActionError(errorMessage(data.error?.code));
        return;
      }
      setDraft(data.blueprint);
      setIssues(data.issues ?? []);
      setRemoved(data.removedPermissions ?? []);
      setRefineText("");
      setDirty(false);
      setStatus("saved");
      setActionSuccess(t("refineSuccess"));
      router.refresh();
    } catch {
      setActionError(errorMessage("unknown"));
    } finally {
      setAction(null);
    }
  }

  async function goReady() {
    if (dirty) {
      const ok = await save(draft);
      if (!ok) return;
    }
    router.push(`/dashboard/${guildId}/ai/${blueprintId}/ready`);
  }

  const welcomeOptions = draft.categories.flatMap((category) =>
    category.channels
      .filter((channel) => channel.type === "text" || channel.type === "announcement")
      .map((channel) => channel.name),
  );

  return (
    <div className="space-y-5">
      <div className="surface p-4">
        <label className="mb-1.5 block text-xs uppercase tracking-wide text-spark-100/50">
          {t("serverName")}
        </label>
        <Input
          value={draft.serverName}
          onChange={(event) => update((next) => (next.serverName = event.target.value))}
          maxLength={100}
          className="text-base font-medium"
        />
      </div>

      <section className="surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">{t("roles")}</h2>
            <p className="mt-0.5 text-[11px] text-spark-100/40">{t("rolesHint")}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              update((next) => {
                next.roles.push({
                  name: t("newRole"),
                  color: "#99AAB5",
                  hoist: false,
                  mentionable: false,
                  permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
                });
              })
            }
          >
            <Plus className="h-3.5 w-3.5" /> {t("addRole")}
          </Button>
        </div>
        {draft.roles.length === 0 ? (
          <p className="text-xs text-spark-100/40">{t("noRoles")}</p>
        ) : (
          <ul className="space-y-1.5">
            {draft.roles.map((role, index) => (
              <li
                key={`${index}-${role.name}`}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-line/60 bg-ink-900/60 px-2.5 py-1.5"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-white/10"
                  style={{ backgroundColor: role.color }}
                />
                <Input
                  value={role.name}
                  onChange={(event) =>
                    update((next) => {
                      const target = next.roles[index];
                      if (target) target.name = event.target.value;
                    })
                  }
                  className="h-7 max-w-52 flex-1 border-0 bg-transparent px-1 py-0 text-xs"
                />
                <span className="text-[10px] text-spark-100/40">
                  {role.permissions.length} {t("permissions")}
                </span>
                <div className="flex gap-0.5">
                  <IconButton
                    label={t("moveUp")}
                    onClick={() =>
                      update((next) => {
                        if (index > 0) {
                          const [item] = next.roles.splice(index, 1);
                          if (item) next.roles.splice(index - 1, 0, item);
                        }
                      })
                    }
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton
                    label={t("moveDown")}
                    onClick={() =>
                      update((next) => {
                        if (index < next.roles.length - 1) {
                          const [item] = next.roles.splice(index, 1);
                          if (item) next.roles.splice(index + 1, 0, item);
                        }
                      })
                    }
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton
                    label={t("delete")}
                    danger
                    onClick={() => update((next) => next.roles.splice(index, 1))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{t("categories")}</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              update((next) => {
                next.categories.push({ name: t("newCategory"), channels: [] });
              })
            }
          >
            <Plus className="h-3.5 w-3.5" /> {t("addCategory")}
          </Button>
        </div>

        {draft.categories.map((category, categoryIndex) => (
          <div key={`${categoryIndex}-${category.name}`} className="surface p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={category.emoji ?? ""}
                onChange={(event) =>
                  update((next) => {
                    const target = next.categories[categoryIndex];
                    if (target) target.emoji = event.target.value || undefined;
                  })
                }
                placeholder="📁"
                aria-label={t("categoryEmoji")}
                maxLength={LIMITS.maxEmojiLength}
                className="h-8 w-12 px-1 text-center text-sm"
              />
              <Input
                value={category.name}
                onChange={(event) =>
                  update((next) => {
                    const target = next.categories[categoryIndex];
                    if (target) target.name = event.target.value;
                  })
                }
                className="h-8 max-w-64 flex-1 text-xs font-medium"
              />
              <div className="flex gap-0.5">
                <IconButton
                  label={t("moveUp")}
                  onClick={() =>
                    update((next) => {
                      if (categoryIndex > 0) {
                        const [item] = next.categories.splice(categoryIndex, 1);
                        if (item) next.categories.splice(categoryIndex - 1, 0, item);
                      }
                    })
                  }
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton
                  label={t("moveDown")}
                  onClick={() =>
                    update((next) => {
                      if (categoryIndex < next.categories.length - 1) {
                        const [item] = next.categories.splice(categoryIndex, 1);
                        if (item) next.categories.splice(categoryIndex + 1, 0, item);
                      }
                    })
                  }
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton
                  label={t("delete")}
                  danger
                  onClick={() => update((next) => next.categories.splice(categoryIndex, 1))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            </div>

            <ul className="mt-2 space-y-1">
              {category.channels.map((channel, channelIndex) => {
                const Icon = channelIcon(channel.type);
                return (
                  <li
                    key={`${channelIndex}-${channel.name}`}
                    className="flex flex-wrap items-center gap-1.5 rounded-md bg-ink-900/50 px-2 py-1"
                  >
                    <Icon className="h-3 w-3 shrink-0 text-spark-100/40" />
                    <Input
                      value={channel.emoji ?? ""}
                      onChange={(event) =>
                        update((next) => {
                          const target = next.categories[categoryIndex]?.channels[channelIndex];
                          if (target) target.emoji = event.target.value || undefined;
                        })
                      }
                      placeholder="▫️"
                      aria-label={t("channelEmoji")}
                      maxLength={LIMITS.maxEmojiLength}
                      className="h-6 w-9 border-0 bg-transparent px-0 text-center text-[11px]"
                    />
                    <Input
                      value={channel.name}
                      onChange={(event) =>
                        update((next) => {
                          const target = next.categories[categoryIndex]?.channels[channelIndex];
                          if (target) target.name = event.target.value;
                        })
                      }
                      className="h-6 max-w-52 flex-1 border-0 bg-transparent px-1 py-0 text-[11px]"
                    />
                    <select
                      value={channel.type}
                      onChange={(event) =>
                        update((next) => {
                          const target = next.categories[categoryIndex]?.channels[channelIndex];
                          if (target) target.type = event.target.value as ChannelType;
                        })
                      }
                      className="h-6 rounded border border-line bg-ink-850 px-1 text-[10px] text-spark-100/70"
                    >
                      {CHANNEL_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {t(
                            `channelType${type.charAt(0).toUpperCase()}${type.slice(1)}` as
                              | "channelTypeText"
                              | "channelTypeVoice"
                              | "channelTypeForum"
                              | "channelTypeAnnouncement",
                          )}
                        </option>
                      ))}
                    </select>
                    <div className="ml-auto flex gap-0.5">
                      <IconButton
                        label={t("moveUp")}
                        onClick={() =>
                          update((next) => {
                            const channels = next.categories[categoryIndex]?.channels;
                            if (channels && channelIndex > 0) {
                              const [item] = channels.splice(channelIndex, 1);
                              if (item) channels.splice(channelIndex - 1, 0, item);
                            }
                          })
                        }
                      >
                        <ChevronUp className="h-3 w-3" />
                      </IconButton>
                      <IconButton
                        label={t("moveDown")}
                        onClick={() =>
                          update((next) => {
                            const channels = next.categories[categoryIndex]?.channels;
                            if (channels && channelIndex < channels.length - 1) {
                              const [item] = channels.splice(channelIndex, 1);
                              if (item) channels.splice(channelIndex + 1, 0, item);
                            }
                          })
                        }
                      >
                        <ChevronDown className="h-3 w-3" />
                      </IconButton>
                      <IconButton
                        label={t("delete")}
                        danger
                        onClick={() =>
                          update((next) => next.categories[categoryIndex]?.channels.splice(channelIndex, 1))
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </IconButton>
                    </div>
                  </li>
                );
              })}
            </ul>
            {category.channels.length === 0 ? (
              <p className="mt-1 px-2 text-[11px] text-spark-100/35">{t("emptyChannels")}</p>
            ) : null}
            <button
              type="button"
              onClick={() =>
                update((next) => {
                  next.categories[categoryIndex]?.channels.push({
                    name: t("newChannel"),
                    type: "text",
                    nsfw: false,
                    permissionOverwrites: [],
                  });
                })
              }
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-spark-300 hover:text-spark-200"
            >
              <Plus className="h-3 w-3" /> {t("addChannel")}
            </button>
          </div>
        ))}
      </section>

      <section className="surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">{t("welcome")}</h2>
        <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
          <div>
            <label className="mb-1 block text-[11px] text-spark-100/45">{t("welcomeChannel")}</label>
            <select
              value={draft.welcome.channel}
              onChange={(event) => update((next) => (next.welcome.channel = event.target.value))}
              className="h-9 w-full rounded-lg border border-line bg-ink-900 px-2 text-xs text-white"
            >
              {welcomeOptions.map((name) => (
                <option key={name} value={name}>
                  #{name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-spark-100/45">{t("welcomeMessage")}</label>
            <Textarea
              value={draft.welcome.message}
              onChange={(event) => update((next) => (next.welcome.message = event.target.value))}
              rows={4}
              maxLength={2000}
              className="text-xs"
            />
          </div>
        </div>
      </section>

      <section className="surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{t("rules")}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update((next) => next.rules.push(""))}
          >
            <Plus className="h-3.5 w-3.5" /> {t("addRule")}
          </Button>
        </div>
        {draft.rules.length === 0 ? (
          <p className="text-xs text-spark-100/40">{t("noRules")}</p>
        ) : (
          <ul className="space-y-1.5">
            {draft.rules.map((rule, index) => (
              <li key={index} className="flex items-center gap-1.5">
                <span className="w-5 text-right text-[11px] text-spark-100/35">{index + 1}.</span>
                <Input
                  value={rule}
                  onChange={(event) =>
                    update((next) => {
                      next.rules[index] = event.target.value;
                    })
                  }
                  maxLength={200}
                  className="h-7 flex-1 text-xs"
                />
                <IconButton
                  label={t("delete")}
                  danger
                  onClick={() => update((next) => next.rules.splice(index, 1))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </section>

      {issues.length > 0 || removed.length > 0 ? (
        <section className="space-y-3">
          {removed.length > 0 ? (
            <Alert variant="warning" title={t("removedTitle")}>
              <p className="mb-2">{t("removedBody")}</p>
              <ul className="flex flex-wrap gap-1.5">
                {removed.map((entry, index) => (
                  <li key={`${entry.role}-${entry.permission}-${index}`}>
                    <Badge variant="danger">
                      {entry.role}: {entry.permission}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Alert>
          ) : null}
          {issues.length > 0 ? (
            <div className="surface-muted p-4">
              <p className="mb-2 text-xs font-medium text-spark-100/80">{t("warnings")}</p>
              <ul className="space-y-1 text-[11px] leading-relaxed text-amber-200/80">
                {issues.slice(0, 12).map((issue, index) => (
                  <li key={`${issue.code}-${index}`}>
                    • {t(`issue.${issue.code}`)}
                    {issue.detail ? <span className="text-spark-100/35"> ({issue.detail})</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : (
        <p className="text-xs text-emerald-300/80">{t("noWarnings")}</p>
      )}

      <section className="surface p-4">
        <h2 className="text-sm font-semibold text-white">{t("refineTitle")}</h2>
        <p className="mt-0.5 text-[11px] text-spark-100/40">{t("costNote", { cost: refineCost })}</p>
        <Textarea
          value={refineText}
          onChange={(event) => setRefineText(event.target.value)}
          rows={2}
          maxLength={600}
          placeholder={t("refinePlaceholder")}
          className="mt-2 text-xs"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => runAction("refine")}
            disabled={action !== null || !canUseAi || refineText.trim().length < 3}
          >
            <Wand2 className="h-3.5 w-3.5" />
            {action === "refine" ? t("refining") : t("refine")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => runAction("regenerate")}
            disabled={action !== null || !canUseAi || balance < regenerateCost}
            title={t("regenerateNote", { cost: regenerateCost })}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", action === "regenerate" && "animate-spin")} />
            {action === "regenerate" ? t("generating") : t("regenerate")}
          </Button>
        </div>
        {actionError ? (
          <Alert variant="danger" className="mt-2">
            {actionError}
          </Alert>
        ) : null}
        {actionSuccess ? (
          <Alert variant="success" className="mt-2">
            {actionSuccess}
          </Alert>
        ) : null}
      </section>

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink-850/95 px-4 py-3 shadow-card backdrop-blur">
        <div className="flex items-center gap-2 text-xs">
          {status === "saving" ? (
            <span className="text-spark-100/50">{tc("saving")}</span>
          ) : status === "saved" && !dirty ? (
            <span className="text-emerald-300/80">{t("saved")}</span>
          ) : status === "error" ? (
            <span className="text-red-300">{t("saveError")}</span>
          ) : (
            <span className="text-spark-100/35">{t("unsaved")}</span>
          )}
          <Button variant="ghost" size="sm" onClick={() => void save(draft)} disabled={status === "saving"}>
            <Save className="h-3.5 w-3.5" /> {t("save")}
          </Button>
        </div>
        <Button onClick={goReady} disabled={status === "saving"}>
          {t("continue")} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "rounded p-1 text-spark-100/35 transition-colors hover:bg-ink-700",
        danger ? "hover:text-red-300" : "hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
