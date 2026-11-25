import { slugifyChannelName, type ServerBlueprint } from "@ohnivo/shared";
import type { AiProvider, AiTextResult, GenerateInput, RefineInput } from "./provider";

/**
 * Deterministic local provider. Used when ANTHROPIC_API_KEY is missing or
 * AI_PROVIDER=mock, so the whole flow (including apply) can be tested
 * without spending money. Clearly labelled as demo mode in the UI.
 */

type BlueprintDraft = Omit<ServerBlueprint, "roles" | "categories" | "welcome" | "rules"> & {
  categories: ServerBlueprint["categories"];
  roles: ServerBlueprint["roles"];
  welcome: ServerBlueprint["welcome"];
  rules: string[];
};

function channel(
  name: string,
  type: ServerBlueprint["categories"][number]["channels"][number]["type"],
  topic?: string,
  emoji?: string,
) {
  return { name, type, ...(emoji ? { emoji } : {}), ...(topic ? { topic } : {}), nsfw: false, permissionOverwrites: [] };
}

function buildForType(prompt: string): BlueprintDraft {
  const p = prompt.toLowerCase();
  const baseRoles: ServerBlueprint["roles"] = [
    {
      name: "Člen",
      color: "#5865F2",
      hoist: false,
      mentionable: true,
      permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY", "ADD_REACTIONS"],
    },
    {
      name: "Helper",
      color: "#22A8F0",
      hoist: true,
      mentionable: true,
      permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "VIEW_AUDIT_LOG"],
    },
    {
      name: "Moderátor",
      color: "#7450F5",
      hoist: true,
      mentionable: true,
      permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "KICK_MEMBERS", "MODERATE_MEMBERS"],
    },
  ];
  const rules = [
    "Buď slušný a respektuj ostatní.",
    "Žádný spam, reklamy ani nevyžádané odkazy.",
    "Drž se tématu kanálu.",
    "Citlivý obsah patří do označených kanálů.",
    "Problémy řeš s moderátory, ne ve veřejném chatu.",
  ];

  if (/(minecraft|mc\b|smp)/.test(p)) {
    return {
      serverName: "Minecraft komunita",
      categories: [
        {
          name: "Přivítání",
          emoji: "✨",
          channels: [
            channel("oznameni", "announcement", "Novinky ze serveru", "📢"),
            channel("pravidla", "text", "Pravidla komunity", "📜"),
            channel("predstaveni", "text", "Představ se ostatním", "👋"),
            channel("informace-o-serveru", "text", "Verze, adresa a základní informace", "🧭"),
          ],
        },
        {
          name: "Komunita",
          emoji: "💬",
          channels: [
            channel("obecny-chat", "text", "Pokec o Minecraftu i mimo něj", "💬"),
            channel("hledam-spoluhrace", "text", "Najdi parťáka na hraní", "🤝"),
            channel("memy", "text", "Minecraftové memy", "😂"),
            channel("ankety", "text", "Hlasování a komunitní otázky", "📊"),
          ],
        },
        {
          name: "Minecraft svět",
          emoji: "⛏️",
          channels: [
            channel("novinky", "text", "Novinky a updaty", "📰"),
            channel("stavby", "text", "Pochlub se stavbami", "🏗️"),
            channel("farmy-a-redstone", "text", "Farmy, redstone a technické stavby", "⚙️"),
            channel("screenshoty", "text", "Nejlepší momenty a screenshoty", "📸"),
            channel("napady-a-navrhy", "text", "Nápady na vylepšení serveru", "💡"),
            channel("bug-reporty", "text", "Nahlášení problémů na serveru", "🐛"),
          ],
        },
        {
          name: "Hlasové kanály",
          emoji: "🔊",
          channels: [
            channel("obecna-hlasovka", "voice", undefined, "🎙️"),
            channel("stavime", "voice", undefined, "🧱"),
            channel("afk", "voice", undefined, "💤"),
          ],
        },
      ],
      roles: [
        ...baseRoles,
        {
          name: "Stavitel",
          color: "#54C7FF",
          hoist: true,
          mentionable: true,
          permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES", "EMBED_LINKS"],
        },
      ],
      welcome: {
        channel: "pravidla",
        message:
          "Vítej v Minecraft komunitě! ⛏️ Přečti si pravidla, představ se v #predstaveni a najdi si parťáka na stavění. Ať tě baví každý blok.",
      },
      rules,
    };
  }

  if (/(fivem|rp\b|roleplay|policie)/.test(p)) {
    return {
      serverName: "FiveM RP komunita",
      categories: [
        {
          name: "Informace",
          emoji: "📋",
          channels: [
            channel("oznameni", "announcement", "Důležité novinky"),
            channel("pravidla", "text", "Pravidla RP"),
            channel("whitelist", "text", "Jak získat whitelist"),
          ],
        },
        {
          name: "Ve městě",
          emoji: "🌆",
          channels: [
            channel("ic-oznameni", "text", "Oznámení ve hře"),
            channel("policie", "text", "Policejní sbor"),
            channel("zachranka", "text", "Záchranná služba"),
            channel("civilni-jobs", "text", "Civilní zaměstnání"),
          ],
        },
        {
          name: "Hlas",
          emoji: "🔊",
          channels: [channel("cekarna", "voice"), channel("rp-kanal", "voice")],
        },
      ],
      roles: [
        ...baseRoles,
        {
          name: "Policie",
          color: "#2F6BFF",
          hoist: true,
          mentionable: true,
          permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "CONNECT"],
        },
        {
          name: "Záchranka",
          color: "#E5484D",
          hoist: true,
          mentionable: true,
          permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "CONNECT"],
        },
      ],
      welcome: {
        channel: "pravidla",
        message:
          "Vítej ve městě! 🌆 Nejdřív si projdi pravidla a whitelist. Potom se přidej do čekárny a naskoč do RP. Drž se příběhu a respektuj ostatní.",
      },
      rules,
    };
  }

  if (/(esport|scrim|turnaj|team)/.test(p)) {
    return {
      serverName: "Esport tým",
      categories: [
        {
          name: "Tým",
          emoji: "🏆",
          channels: [
            channel("oznameni", "announcement", "Zápasy a novinky"),
            channel("pravidla", "text", "Týmová pravidla"),
            channel("tryouty", "text", "Přihlášky do týmu"),
          ],
        },
        {
          name: "Zápasy",
          emoji: "🎯",
          channels: [
            channel("scrimy", "text", "Plánování scrimů"),
            channel("vysledky", "text", "Výsledky a statistiky"),
            channel("strategie", "text", "VOD a strategie"),
          ],
        },
        {
          name: "Hlas",
          emoji: "🎧",
          channels: [channel("team-1", "voice"), channel("team-2", "voice")],
        },
      ],
      roles: [
        ...baseRoles,
        {
          name: "Hráč",
          color: "#54C7FF",
          hoist: true,
          mentionable: true,
          permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "CONNECT"],
        },
        {
          name: "Kouč",
          color: "#F5A524",
          hoist: true,
          mentionable: true,
          permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "CONNECT", "MANAGE_MESSAGES"],
        },
      ],
      welcome: {
        channel: "pravidla",
        message:
          "Vítej v týmu! 🏆 Přečti si pravidla, mrkni na tryouty a ozvi se kouči. Tréninky jsou pravidelné, docházku ber vážně.",
      },
      rules,
    };
  }

  if (/(startup|produkt|beta|saas)/.test(p)) {
    return {
      serverName: "Produktová komunita",
      categories: [
        {
          name: "Produkt",
          emoji: "🚀",
          channels: [
            channel("oznameni", "announcement", "Novinky a release notes"),
            channel("pravidla", "text", "Pravidla komunity"),
            channel("beta", "text", "Beta přístup a feedback"),
          ],
        },
        {
          name: "Diskuze",
          emoji: "💬",
          channels: [
            channel("obecna-diskuze", "text", "O čemkoli"),
            channel("bug-reporty", "text", "Našel jsi chybu?"),
            channel("napady", "text", "Nápady na produkt"),
          ],
        },
        {
          name: "Hlas",
          emoji: "🔊",
          channels: [channel("standup", "voice")],
        },
      ],
      roles: [
        ...baseRoles,
        {
          name: "Beta tester",
          color: "#54C7FF",
          hoist: true,
          mentionable: true,
          permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
        },
        {
          name: "Tým",
          color: "#F5A524",
          hoist: true,
          mentionable: true,
          permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES"],
        },
      ],
      welcome: {
        channel: "pravidla",
        message:
          "Vítej v produktové komunitě! 🚀 Přečti si pravidla, mrkni na beta kanál a neboj se napsat feedback. Každý nápad má váhu.",
      },
      rules,
    };
  }

  if (/(tvůrc|creator|ilustr|artist|youtube|twitch)/.test(p)) {
    return {
      serverName: "Tvůrčí komunita",
      categories: [
        {
          name: "Přivítání",
          emoji: "✨",
          channels: [
            channel("oznameni", "announcement", "Novinky z komunity"),
            channel("pravidla", "text", "Pravidla"),
            channel("predstaveni", "text", "Představ svou tvorbu"),
          ],
        },
        {
          name: "Tvorba",
          emoji: "🎨",
          channels: [
            channel("galerie", "text", "Ukazuj svou tvorbu"),
            channel("feedback", "text", "Popros o feedback"),
            channel("spoluprace", "text", "Hledáš spolupráci?"),
          ],
        },
        {
          name: "Hlas",
          emoji: "🔊",
          channels: [channel("kreslime-spolu", "voice"), channel("povidejme", "voice")],
        },
      ],
      roles: [
        ...baseRoles,
        {
          name: "Tvůrce",
          color: "#F5A524",
          hoist: true,
          mentionable: true,
          permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES", "EMBED_LINKS"],
        },
      ],
      welcome: {
        channel: "pravidla",
        message:
          "Vítej mezi tvůrce! 🎨 Přečti si pravidla, hoď svou tvorbu do galerie a neboj se říct o feedback. Tvoř, sdílej, podporuj.",
      },
      rules,
    };
  }

  return {
    serverName: "Gaming komunita",
    categories: [
      {
        name: "Přivítání",
        emoji: "👋",
        channels: [
          channel("oznameni", "announcement", "Novinky a eventy"),
          channel("pravidla", "text", "Pravidla komunity"),
          channel("predstaveni", "text", "Představ se"),
        ],
      },
      {
        name: "Komunita",
        emoji: "🎮",
        channels: [
          channel("obecny-chat", "text", "Povídej si o čemkoli"),
          channel("hledam-spoluhrace", "text", "Najdi si parťáky"),
          channel("klipy", "text", "Nejlepší momenty"),
          channel("navrhy", "text", "Co zlepšit?"),
        ],
      },
      {
        name: "Hlas",
        emoji: "🔊",
        channels: [channel("obecna-hlasovka", "voice"), channel("herni-kanal", "voice")],
      },
    ],
    roles: baseRoles,
    welcome: {
      channel: "pravidla",
      message:
        "Vítej v komunitě! 🎮 Přečti si pravidla, představ se a přidej se do hlasovky. Hrajeme pro zábavu a respektujeme se.",
    },
    rules,
  };
}

function asResult(draft: BlueprintDraft): AiTextResult {
  return { text: JSON.stringify(draft), model: "mock:jiskrik-v1", inputTokens: 0, outputTokens: 0 };
}

function refineDraft(blueprint: ServerBlueprint, instruction: string): ServerBlueprint {
  const next: ServerBlueprint = JSON.parse(JSON.stringify(blueprint)) as ServerBlueprint;
  const p = instruction.toLowerCase();
  const categoryNames = new Set(next.categories.map((category) => category.name.toLowerCase()));

  if (/(ticket|podpor)/.test(p) && !categoryNames.has("podpora")) {
    next.categories.push({
      name: "Podpora",
      emoji: "🎫",
      channels: [channel("ticket-panel", "text", "Vytvoř si ticket"), channel("ticket-log", "text")],
    });
  }
  if (/(vip|premium)/.test(p) && !next.roles.some((role) => role.name.toLowerCase() === "vip")) {
    next.roles.push({
      name: "VIP",
      color: "#F5A524",
      hoist: true,
      mentionable: true,
      permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
    });
  }
  if (/(hudb|music|hudeb)/.test(p) && !categoryNames.has("hudba")) {
    next.categories.push({
      name: "Hudba",
      emoji: "🎵",
      channels: [channel("hudebni-kanal", "voice")],
    });
  }
  if (/(oznam|announce)/.test(p)) {
    const hasAnnouncement = next.categories.some((category) =>
      category.channels.some((c) => c.type === "announcement"),
    );
    if (!hasAnnouncement && next.categories[0]) {
      next.categories[0].channels.unshift(channel("oznameni", "announcement", "Novinky"));
    }
  }
  if (/(pravidl|rules)/.test(p) && next.rules.length === 0) {
    next.rules = ["Buď slušný.", "Žádný spam.", "Drž se tématu."];
  }
  if (/(hlas|voice)/.test(p) && !next.categories.some((category) => category.name.toLowerCase() === "hlas")) {
    next.categories.push({
      name: "Hlas",
      emoji: "🔊",
      channels: [channel("nove-hlasovky", "voice")],
    });
  }

  const alreadyChanged =
    next.categories.length !== blueprint.categories.length ||
    next.roles.length !== blueprint.roles.length ||
    next.rules.length !== blueprint.rules.length;

  if (!alreadyChanged) {
    const slug = slugifyChannelName(instruction).slice(0, 24) || "uprava";
    const target = next.categories[0];
    if (target) {
      const exists = next.categories.some((category) =>
        category.channels.some((c) => c.name === `uprava-${slug}`),
      );
      if (!exists) target.channels.push(channel(`uprava-${slug}`, "text", instruction.slice(0, 200)));
    }
  }

  return next;
}

export function createMockProvider(): AiProvider {
  return {
    name: "mock:jiskrik-v1",
    async generate(input: GenerateInput): Promise<AiTextResult> {
      return asResult(buildForType(input.prompt));
    },
    async refine(input: RefineInput): Promise<AiTextResult> {
      return asResult(refineDraft(input.blueprint, input.instruction));
    },
  };
}
