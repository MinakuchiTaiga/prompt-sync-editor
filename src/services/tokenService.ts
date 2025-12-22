import type { LLMProvider, ApiKeys } from "../types";
import { LLM_MODELS } from "../constants";

export const fetchTokenCount = async (
  text: string,
  llmProvider: LLMProvider,
  apiKeys: ApiKeys
): Promise<number> => {
  if (!text || !text.trim()) return 0;

  const apiKey = apiKeys[llmProvider];
  if (!apiKey) return 0;

  try {
    switch (llmProvider) {
      case "gemini": {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${LLM_MODELS.gemini}:countTokens?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: text }] }],
            }),
          }
        );
        const data = await response.json();
        return data.totalTokens || 0;
      }

      case "openai": {
        const hasJapanese =
          /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(
            text
          );
        return Math.ceil(text.length / (hasJapanese ? 2 : 4));
      }

      case "claude": {
        const response = await fetch(
          "https://api.anthropic.com/v1/messages/count_tokens",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: LLM_MODELS.claude,
              messages: [{ role: "user", content: text }],
            }),
          }
        );
        const data = await response.json();
        return data.input_tokens || 0;
      }

      default:
        return 0;
    }
  } catch (error: unknown) {
    console.warn("Token count failed", error);
    const hasJapanese =
      /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(
        text
      );
    return Math.ceil(text.length / (hasJapanese ? 2 : 4));
  }
};
