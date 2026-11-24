import type { ServerBlueprint } from "@ohnivo/shared";

export interface AiTextResult {
  text: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface GenerateInput {
  prompt: string;
  retryError?: string;
}

export interface RefineInput {
  blueprint: ServerBlueprint;
  instruction: string;
  retryError?: string;
}

export interface AiProvider {
  readonly name: string;
  generate(input: GenerateInput): Promise<AiTextResult>;
  refine(input: RefineInput): Promise<AiTextResult>;
}

export function extractJson(text: string): unknown {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model output");
  }
  const slice = cleaned.slice(start, end + 1);
  return JSON.parse(slice) as unknown;
}
