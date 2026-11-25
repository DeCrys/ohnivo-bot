/**
 * The bot writes apply-job errors in the guild's locale, which is not always
 * the locale the dashboard is viewed in. These helpers recognise the fixed
 * replacement-preflight messages (Czech or English) and let the UI render them
 * in the viewer's own language instead of echoing the bot's text.
 */

export type ReplacementBlocker =
  | { kind: "hierarchy"; count: number; names: string }
  | { kind: "channels"; count: number; names: string }
  | { kind: "manageRoles" };

const STAFF_PERMISSION_FAILURE =
  /(?:Nahrazení bylo zastaveno, protože bot nemůže přidělit některá požadovaná oprávnění staff rolím\. Stávající struktura zůstala nedotčená\.|Replacement stopped because the bot cannot grant one or more requested staff permissions\. The existing structure was left untouched\.?)/i;
const OMITTED_STAFF_PERMISSIONS = [
  /Vynechána oprávnění staff role, která bot nemá:\s*([^.]+)\./i,
  /Skipped staff permissions the bot does not have:\s*([^.]+)\./i,
];
const PREFIX = /^(?:Nahrazení bylo zastaveno před smazáním|Replacement stopped before deleting anything):\s*/;
const SUFFIXES = [
  /\.\s*(?:V Discordu otevři|In Discord open)\b[\s\S]*$/,
  /\.\s*(?:Povol botovi potřebná oprávnění nebo uprav pozice rolí a potom akci spusť znovu|Grant the bot the required permissions or adjust role positions and retry)\.?$/,
];

const HIERARCHY = [
  /^(\d+)\s+rolí je na stejné nebo vyšší pozici než nejvyšší role bota(?:\s*\((.+)\))?\.?$/,
  /^(\d+)\s+roles are at or above the bot['’]s highest role(?:\s*\((.+)\))?\.?$/,
];
const CHANNELS = [
  /^(\d+)\s+kanálů nepovoluje oprávnění Spravovat kanály\s*\((.+)\)$/,
  /^(\d+)\s+channels deny Manage Channels\s*\((.+)\)$/,
];
const MANAGE_ROLES = [
  /^botovi chybí oprávnění Spravovat role$/,
  /^the bot is missing Manage Roles$/,
];

function matchPair(patterns: RegExp[], part: string) {
  for (const pattern of patterns) {
    const match = part.match(pattern);
    if (match) return { count: Number(match[1]), names: match[2] ?? "" };
  }
  return null;
}

export function isStaffPermissionFailure(error: string | null): boolean {
  return Boolean(error && STAFF_PERMISSION_FAILURE.test(error));
}

export function parseOmittedStaffPermissions(error: string | null | undefined): string[] | null {
  if (!error) return null;
  for (const pattern of OMITTED_STAFF_PERMISSIONS) {
    const match = error.match(pattern);
    if (match?.[1]) {
      return match[1]
        .split(",")
        .map((permission) => permission.trim())
        .filter(Boolean);
    }
  }
  return null;
}

/**
 * Returns the structured blockers when `error` is one of the known replacement
 * preflight failures, or `null` when the message is something else (unknown
 * errors are shown as-is).
 */
export function parseReplacementBlockers(error: string | null): ReplacementBlocker[] | null {
  if (!error) return null;
  if (!PREFIX.test(error)) return null;

  const suffix = SUFFIXES.find((pattern) => pattern.test(error));
  if (!suffix) return null;

  const body = error.replace(PREFIX, "").replace(suffix, "");
  const parts = body
    .split("; ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;

  const blockers: ReplacementBlocker[] = [];
  for (const part of parts) {
    if (MANAGE_ROLES.some((pattern) => pattern.test(part))) {
      blockers.push({ kind: "manageRoles" });
      continue;
    }
    const hierarchy = matchPair(HIERARCHY, part);
    if (hierarchy) {
      blockers.push({ kind: "hierarchy", ...hierarchy });
      continue;
    }
    const channels = matchPair(CHANNELS, part);
    if (channels) {
      blockers.push({ kind: "channels", ...channels });
      continue;
    }
    // Unknown blocker: bail out so the original message stays intact.
    return null;
  }

  return blockers;
}
