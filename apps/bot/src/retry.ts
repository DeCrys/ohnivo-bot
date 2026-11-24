import { logger } from "./logger.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

interface RetryableError {
  status?: number;
  retryAfter?: number;
  retry_after?: number;
  httpStatus?: number;
  message?: string;
}

function retryDelayMs(error: unknown, attempt: number): number | null {
  const candidate = error as RetryableError;
  const status = candidate.status ?? candidate.httpStatus;
  const retryAfter =
    typeof candidate.retryAfter === "number"
      ? candidate.retryAfter > 100
        ? candidate.retryAfter
        : candidate.retryAfter * 1000
      : typeof candidate.retry_after === "number"
        ? candidate.retry_after * 1000
        : null;

  if (status === 429) {
    return Math.min(retryAfter ?? 1000 * 2 ** attempt, 30_000);
  }
  if (status && status >= 500) {
    return Math.min(500 * 2 ** attempt, 15_000);
  }
  if (status === 502 || status === 503 || status === 504) {
    return Math.min(500 * 2 ** attempt, 15_000);
  }
  return null;
}

/**
 * Discord rate limits are per-route and bursty. We retry 429s and transient
 * 5xx responses with exponential backoff; 4xx validation errors bubble up so
 * the job fails and rolls back instead of looping forever.
 */
export async function withDiscordRetry<T>(
  label: string,
  action: () => Promise<T>,
  attempts = 5,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      const delay = retryDelayMs(error, attempt);
      if (delay === null || attempt === attempts - 1) break;
      logger.warn(`Discord call failed, retrying in ${delay}ms: ${label}`, {
        attempt: attempt + 1,
        status: (error as RetryableError).status,
      });
      await sleep(delay);
    }
  }
  throw lastError;
}
