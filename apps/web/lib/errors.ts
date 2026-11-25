export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "insufficient_credits"
  | "plan_required"
  | "rate_limited"
  | "invalid_input"
  | "ai_failed"
  | "ai_invalid_output"
  | "job_active"
  | "stripe_missing"
  | "config_missing"
  | "guild_not_found"
  | "bot_missing"
  | "replace_not_ready"
  | "unknown";

const STATUS: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  insufficient_credits: 402,
  plan_required: 402,
  rate_limited: 429,
  invalid_input: 400,
  ai_failed: 502,
  ai_invalid_output: 502,
  job_active: 409,
  stripe_missing: 503,
  config_missing: 500,
  guild_not_found: 404,
  bot_missing: 409,
  replace_not_ready: 503,
  unknown: 500,
};

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly detail?: unknown;

  constructor(code: ApiErrorCode, message?: string, detail?: unknown) {
    super(message ?? code);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS[code];
    this.detail = detail;
  }
}

export function isInsufficientCreditsError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String(error.message) : "";
  return message.includes("insufficient_credits");
}
