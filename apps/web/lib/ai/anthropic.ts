import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";
import { AppError } from "../errors";
import {
  buildGenerateMessage,
  buildRefineMessage,
  BLUEPRINT_SYSTEM_PROMPT,
} from "./prompt";
import type { AiProvider, AiTextResult, GenerateInput, RefineInput } from "./provider";

export function createAnthropicProvider(): AiProvider {
  if (!env.ANTHROPIC_API_KEY) {
    throw new AppError("config_missing", "ANTHROPIC_API_KEY is not configured");
  }
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const model = env.ANTHROPIC_MODEL;

  async function complete(userMessage: string, maxTokens: number): Promise<AiTextResult> {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature: 0.5,
        system: BLUEPRINT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });
      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");
      return {
        text,
        model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Anthropic error";
      console.error("[ai] Anthropic request failed", message);
      throw new AppError("ai_failed", "Anthropic request failed");
    }
  }

  return {
    name: `anthropic:${model}`,
    generate: (input: GenerateInput) => complete(buildGenerateMessage(input.prompt, input.retryError), 8000),
    refine: (input: RefineInput) =>
      complete(buildRefineMessage(input.blueprint, input.instruction, input.retryError), 8000),
  };
}
