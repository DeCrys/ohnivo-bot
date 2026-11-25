import { ZodError } from "zod";
import {
  normalizeBlueprint,
  type BlueprintIssue,
  type NormalizedBlueprint,
  type RemovedPermission,
  type ServerBlueprint,
} from "@ohnivo/shared";
import { env, isAiConfigured } from "../env";
import { AppError } from "../errors";
import { createAnthropicProvider } from "./anthropic";
import { createMockProvider } from "./mock";
import { createNvidiaProvider } from "./nvidia";
import { extractJson, type AiProvider, type AiTextResult } from "./provider";

export interface ValidatedBlueprint {
  blueprint: ServerBlueprint;
  issues: BlueprintIssue[];
  removedPermissions: RemovedPermission[];
  model: string;
  demo: boolean;
  inputTokens?: number;
  outputTokens?: number;
}

let provider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (provider) return provider;
  if (env.AI_PROVIDER === "mock") {
    provider = createMockProvider();
  } else if (env.AI_PROVIDER === "anthropic") {
    provider = createAnthropicProvider();
  } else if (env.AI_PROVIDER === "nvidia") {
    provider = createNvidiaProvider();
  } else {
    // auto
    if (env.NVIDIA_API_KEY) {
      provider = createNvidiaProvider();
    } else if (isAiConfigured()) {
      provider = createAnthropicProvider();
    } else {
      provider = createMockProvider();
    }
  }
  return provider;
}

export function isDemoMode(): boolean {
  if (env.AI_PROVIDER === "mock") return true;
  return env.AI_PROVIDER === "auto" && !isAiConfigured();
}

function describeValidationError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .slice(0, 6)
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
  }
  if (error instanceof Error) return error.message;
  return "Unknown validation error";
}

function toValidated(result: AiTextResult): ValidatedBlueprint {
  const raw = extractJson(result.text);
  const normalized: NormalizedBlueprint = normalizeBlueprint(raw);
  return {
    ...normalized,
    model: result.model,
    demo: result.model.startsWith("mock"),
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  };
}

/**
 * One retry with the validation error appended, as required by the spec.
 * Anything still invalid after that is a hard failure (credits are refunded
 * by the calling route).
 */
export async function generateValidatedBlueprint(prompt: string): Promise<ValidatedBlueprint> {
  const ai = getAiProvider();
  let retryError: string | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await ai.generate({ prompt, retryError });
    try {
      return toValidated(result);
    } catch (error) {
      retryError = describeValidationError(error).slice(0, 500);
      console.warn(`[ai] generation attempt ${attempt + 1} failed validation: ${retryError}`);
    }
  }
  throw new AppError("ai_invalid_output", "AI returned invalid output twice", retryError);
}

export async function refineValidatedBlueprint(
  blueprint: ServerBlueprint,
  instruction: string,
): Promise<ValidatedBlueprint> {
  const ai = getAiProvider();
  let retryError: string | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await ai.refine({ blueprint, instruction, retryError });
    try {
      return toValidated(result);
    } catch (error) {
      retryError = describeValidationError(error).slice(0, 500);
      console.warn(`[ai] refine attempt ${attempt + 1} failed validation: ${retryError}`);
    }
  }
  throw new AppError("ai_invalid_output", "AI returned invalid output twice", retryError);
}
