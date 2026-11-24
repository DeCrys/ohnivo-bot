import { AppError } from "../errors";
import { LIMITS } from "@ohnivo/shared";

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/**
 * AI prompts are untrusted input. Strip control characters, normalise
 * whitespace and enforce a hard length limit before anything is sent.
 */
export function sanitizeUserPrompt(raw: unknown, maxLength: number): string {
  if (typeof raw !== "string") {
    throw new AppError("invalid_input", "Prompt must be a string");
  }
  const cleaned = raw
    .replace(CONTROL, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  if (cleaned.length < 3) {
    throw new AppError("invalid_input", "Prompt is too short");
  }
  if (cleaned.length > maxLength) {
    throw new AppError("invalid_input", `Prompt exceeds ${maxLength} characters`);
  }
  return cleaned;
}

export function sanitizePrompt(raw: unknown): string {
  return sanitizeUserPrompt(raw, LIMITS.maxPromptLength);
}

export function sanitizeInstruction(raw: unknown): string {
  return sanitizeUserPrompt(raw, LIMITS.maxRefineInstructionLength);
}
