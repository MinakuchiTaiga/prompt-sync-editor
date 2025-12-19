/**
 * AIの出力を洗浄するユーティリティ
 *
 * プロンプトインジェクション攻撃により、AIが悪意のあるHTMLやスクリプトを
 * 出力する可能性があるため、それらを無害化します。
 */

/**
 * 危険なHTMLタグやスクリプトをエスケープする
 */
export function sanitizeAIOutput(text: string): string {
  if (!text) return text;

  let sanitized = text;

  // 1. <script>タグを無害化（大文字小文字を区別しない）
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    (match) => {
      console.warn("🔒 Blocked <script> tag in AI output:", match);
      return escapeHtml(match);
    }
  );

  // 2. インラインイベントハンドラーを無害化（onerror, onclick, onload等）
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, (match) => {
    console.warn("🔒 Blocked inline event handler in AI output:", match);
    return escapeHtml(match);
  });

  // 3. javascript: プロトコルを無害化
  sanitized = sanitized.replace(/javascript:/gi, (match) => {
    console.warn("🔒 Blocked javascript: protocol in AI output");
    return escapeHtml(match);
  });

  // 4. data:text/html を無害化
  sanitized = sanitized.replace(/data:text\/html/gi, (match) => {
    console.warn("🔒 Blocked data:text/html in AI output");
    return escapeHtml(match);
  });

  // 5. <iframe>タグを無害化
  sanitized = sanitized.replace(
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    (match) => {
      console.warn("🔒 Blocked <iframe> tag in AI output:", match);
      return escapeHtml(match);
    }
  );

  // 6. <object>と<embed>タグを無害化
  sanitized = sanitized.replace(/<(object|embed)\b[^>]*>/gi, (match) => {
    console.warn("🔒 Blocked <object>/<embed> tag in AI output:", match);
    return escapeHtml(match);
  });

  return sanitized;
}

/**
 * HTMLエスケープ
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 危険なパターンを検出（警告用）
 */
export function detectDangerousPatterns(text: string): string[] {
  const warnings: string[] = [];

  // <script>タグの検出
  if (/<script\b/i.test(text)) {
    warnings.push("<script>タグが検出されました");
  }

  // インラインイベントハンドラーの検出
  if (/\s+on\w+\s*=/i.test(text)) {
    warnings.push("インラインイベントハンドラー（onclick等）が検出されました");
  }

  // javascript: プロトコルの検出
  if (/javascript:/i.test(text)) {
    warnings.push("javascript:プロトコルが検出されました");
  }

  // <iframe>タグの検出
  if (/<iframe\b/i.test(text)) {
    warnings.push("<iframe>タグが検出されました");
  }

  return warnings;
}

/**
 * コードブロック内のタグは保護する（マークダウン対応）
 * コードブロック（```で囲まれた部分）やインラインコード（`で囲まれた部分）内の
 * タグはエスケープせず、それ以外をサニタイズします。
 */
export function sanitizeAIOutputWithCodeProtection(text: string): string {
  if (!text) return text;

  const codeBlocks: { placeholder: string; original: string }[] = [];
  let sanitized = text;
  let placeholderIndex = 0;

  // 1. コードブロック（```...```）を一時的に退避
  sanitized = sanitized.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `__CODE_BLOCK_${placeholderIndex}__`;
    codeBlocks.push({ placeholder, original: match });
    placeholderIndex++;
    return placeholder;
  });

  // 2. インラインコード（`...`）を一時的に退避
  sanitized = sanitized.replace(/`[^`]+`/g, (match) => {
    const placeholder = `__INLINE_CODE_${placeholderIndex}__`;
    codeBlocks.push({ placeholder, original: match });
    placeholderIndex++;
    return placeholder;
  });

  // 3. コードブロック以外の部分をサニタイズ
  sanitized = sanitizeAIOutput(sanitized);

  // 4. コードブロックを元に戻す
  codeBlocks.forEach(({ placeholder, original }) => {
    sanitized = sanitized.replace(placeholder, original);
  });

  return sanitized;
}
