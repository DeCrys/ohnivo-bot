import { env } from "../env";
import { AppError } from "../errors";
import {
  buildGenerateMessage,
  buildRefineMessage,
  BLUEPRINT_SYSTEM_PROMPT,
} from "./prompt";
import type { AiProvider, AiTextResult, GenerateInput, RefineInput } from "./provider";

function getNvidiaKey(): string {
  const key = env.NVIDIA_API_KEY;
  if (key) return key;

  if (env.NODE_ENV === "development") {
    try {
      const fs = require("fs");
      const path = "c:\\Users\\hry15\\Desktop\\nvidia api key.txt";
      const fileKey = fs.readFileSync(path, "utf8").trim();
      if (fileKey) return fileKey;
    } catch {
      // ignore missing local key file
    }
  }

  throw new AppError("config_missing", "NVIDIA_API_KEY is not configured");
}

export function createNvidiaProvider(): AiProvider {
  const apiKey = getNvidiaKey();
  const model = env.NVIDIA_MODEL;

  async function complete(userMessage: string, maxTokens: number): Promise<AiTextResult> {
    try {
      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        // Some models can hang for minutes; fail fast instead of freezing the request.
        signal: AbortSignal.timeout(120_000),
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: BLUEPRINT_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          temperature: 0.5,
          max_tokens: maxTokens,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Nvidia API error ${res.status}: ${text}`);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      if (!content.trim()) {
        // Reasoning models can burn the whole token budget on reasoning_content.
        throw new Error(
          `Nvidia returned empty content (finish_reason=${data.choices?.[0]?.finish_reason ?? "unknown"})`,
        );
      }
      const usage = data.usage ?? {};
      return {
        text: content,
        model,
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Nvidia error";
      console.error("[ai] Nvidia request failed", message);
      throw new AppError("ai_failed", "Nvidia request failed");
    }
  }

  return {
    name: `nvidia:${model}`,
    generate: (input: GenerateInput) => complete(buildGenerateMessage(input.prompt, input.retryError), 8000),
    refine: (input: RefineInput) =>
      complete(buildRefineMessage(input.blueprint, input.instruction, input.retryError), 8000),
  };
}
