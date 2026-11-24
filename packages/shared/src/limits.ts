/**
 * Hard limits enforced in code. The model prompt mentions them too, but the
 * prompt is never trusted as a security boundary.
 */
export const LIMITS = {
  maxCategories: 20,
  maxChannelsPerCategory: 50,
  maxChannelsTotal: 200,
  maxRoles: 100,
  maxNameLength: 100,
  maxTopicLength: 1024,
  maxWelcomeMessageLength: 2000,
  maxRules: 15,
  maxRuleLength: 200,
  maxPermissionOverwritesPerChannel: 20,
  maxPromptLength: 1200,
  maxRefineInstructionLength: 600,
  maxServerNameLength: 100,
  maxEmojiLength: 32,
} as const;

export type LimitKey = keyof typeof LIMITS;
