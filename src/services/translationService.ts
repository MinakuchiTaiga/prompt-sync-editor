import type { LLMProvider, ApiKeys } from "../types";
import { LLM_MODELS, SYSTEM_PROMPT_TEMPLATE } from "../constants";
import { sanitizeInput, validateTranslation } from "../utils/validationUtils";
import {
  sanitizeAIOutputWithCodeProtection,
  detectDangerousPatterns,
} from "../sanitizer";

export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string,
  llmProvider: LLMProvider,
  apiKeys: ApiKeys
): Promise<string | undefined> => {
  const apiKey = apiKeys[llmProvider];
  if (!text.trim() || !apiKey) {
    return undefined;
  }

  const sanitizedText = sanitizeInput(text);
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE(sourceLang, targetLang);

  let translatedContent = "";

  switch (llmProvider) {
    case "gemini": {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${LLM_MODELS.gemini}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: sanitizedText }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Translation failed");
      }

      translatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      break;
    }

    case "openai": {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: LLM_MODELS.openai,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: sanitizedText },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Translation failed");
      }

      translatedContent = data.choices?.[0]?.message?.content || "";
      break;
    }

    case "claude": {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: LLM_MODELS.claude,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: sanitizedText }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Translation failed");
      }

      translatedContent = data.content?.[0]?.text || "";
      break;
    }
  }

  const trimmedTranslation = translatedContent.trim();

  if (!validateTranslation(sanitizedText, trimmedTranslation)) {
    throw new Error("翻訳結果が不正です。入力を確認してください。");
  }

  const sanitizedOutput =
    sanitizeAIOutputWithCodeProtection(trimmedTranslation);

  const warnings = detectDangerousPatterns(trimmedTranslation);
  if (warnings.length > 0) {
    console.warn(
      "⚠️ AIの出力に危険なパターンが検出され、無害化されました:",
      warnings
    );
  }

  return sanitizedOutput;
};
