import type { ServerBlueprint } from "./blueprint.js";

export type BotLocale = "cs" | "en";

export interface WelcomeTemplateParams {
  serverName: string;
  ownerDiscordId?: string | null;
  rules: string[];
  blueprint: ServerBlueprint;
}

const templates: Record<BotLocale, (params: WelcomeTemplateParams) => string> = {
  cs: ({ serverName, ownerDiscordId, rules }) => {
    const mention = ownerDiscordId ? `<@${ownerDiscordId}>` : "zakladatel";
    const lines = [
      `Vítej na **${serverName}**! ✨`,
      "",
      `${mention} právě zapálil nový server s Ohnivem. Tady je první jiskra.`,
      "Projdi si kanály, představ se a rozjeď to.",
    ];
    if (rules.length > 0) {
      lines.push("", "**Pravidla, ať to tu drží pohromadě:**");
      rules.forEach((rule, index) => lines.push(`${index + 1}. ${rule}`));
    }
    lines.push("", "_Server vytvořilo Ohnivo. Popiš, co chceš změnit, a Jiskřík to upraví._");
    return lines.join("\n");
  },
  en: ({ serverName, ownerDiscordId, rules }) => {
    const mention = ownerDiscordId ? `<@${ownerDiscordId}>` : "the founder";
    const lines = [
      `Welcome to **${serverName}**! ✨`,
      "",
      `${mention} just sparked a new server with Ohnivo. Here is the first spark.`,
      "Take a look around, introduce yourself and get things going.",
    ];
    if (rules.length > 0) {
      lines.push("", "**House rules:**");
      rules.forEach((rule, index) => lines.push(`${index + 1}. ${rule}`));
    }
    lines.push("", "_This server was built by Ohnivo. Describe what to change and Jiskřík will adjust it._");
    return lines.join("\n");
  },
};

export function buildWelcomeMessage(
  locale: string | null | undefined,
  params: WelcomeTemplateParams,
): string {
  const normalized: BotLocale = locale === "en" ? "en" : "cs";
  const custom = params.blueprint.welcome.message.trim();
  if (custom) {
    const rulesBlock =
      params.rules.length > 0
        ? `\n\n**${normalized === "en" ? "House rules" : "Pravidla"}:**\n${params.rules
            .map((rule, index) => `${index + 1}. ${rule}`)
            .join("\n")}`
        : "";
    return `${custom.slice(0, 1800)}${rulesBlock}`.slice(0, 2000);
  }
  return templates[normalized](params).slice(0, 2000);
}

export const botMessages = {
  cs: {
    applyStarted: "Stavím tvůj server…",
    applyCompleted: "Server je hotový. Jiskra zapálena! ✨",
    applyFailed: "Něco se pokazilo, vrácení změn dokončeno.",
    missingPermissions:
      "Bot nemá dostatečná oprávnění. Dej mu prosím Manage Channels, Manage Roles a Send Messages.",
    guildMissing: "Server už neexistuje nebo mě z něj někdo vyhodil.",
  },
  en: {
    applyStarted: "Building your server…",
    applyCompleted: "Your server is ready. Spark ignited! ✨",
    applyFailed: "Something went wrong, rollback finished.",
    missingPermissions:
      "The bot is missing permissions. Please grant Manage Channels, Manage Roles and Send Messages.",
    guildMissing: "The server no longer exists or the bot was removed.",
  },
} as const;
