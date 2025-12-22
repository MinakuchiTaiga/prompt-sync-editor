// Input sanitization for prompt injection prevention
export const sanitizeInput = (text: string): string => {
  // Remove potential system instruction attempts
  const cleaned = text
    // Remove system instruction markers
    .replace(/(?:system|assistant|user):\s*/gi, "")
    // Neutralize potential instruction injections
    .replace(
      /(?:ignore|disregard|forget)[\s\w]*(?:previous|above|prior|all)[\s\w]*(?:instructions?|rules?|directives?)/gi,
      "[filtered]"
    )
    // Remove attempts to escape context
    .replace(/```[\s\S]*?(?:system|assistant)[\s\S]*?```/gi, "[filtered]")
    .trim();

  return cleaned;
};

// Validate output to ensure it's a legitimate translation
export const validateTranslation = (
  original: string,
  translated: string
): boolean => {
  // Check if output is suspiciously short compared to input
  if (original.length > 100 && translated.length < 10) return false;

  // Check if output contains system-like responses (signs of successful injection)
  const systemResponses = [
    /i('m| am) (sorry|an? (ai|language model|assistant))/i,
    /i (can('t| not)|cannot) (do that|assist|help with)/i,
    /as an? (ai|language model|assistant)/i,
  ];

  if (systemResponses.some((pattern) => pattern.test(translated))) {
    return false;
  }

  return true;
};
