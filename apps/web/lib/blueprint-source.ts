/**
 * AI generations always store a prompt; drafts created without AI store an
 * empty one. Migration 0007 adds `source` as the authoritative marker, but the
 * prompt keeps the app correct while the migration is still pending.
 */
export function isManualBlueprint(blueprint: {
  source?: "ai" | "manual" | null;
  prompt: string;
}): boolean {
  return blueprint.source === "manual" || (blueprint.source !== "ai" && blueprint.prompt === "");
}
