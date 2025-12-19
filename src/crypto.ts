/**
 * LocalStorage暗号化ユーティリティ
 *
 * ⚠️ 注意: これはXSS攻撃からAPIキーを守るものではありません。
 * 単純なlocalStorageダンプや、デベロッパーツールでの閲覧を防ぐ「難読化」です。
 * XSS攻撃者は復号化関数も実行できるため、根本的な防御にはなりません。
 */

const CRYPTO_ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * ブラウザフィンガープリントベースの派生キーを生成
 * ユーザーエージェントとタイムゾーンから派生キーを作る
 */
async function getDerivedKey(): Promise<CryptoKey> {
  // ブラウザの基本情報から派生文字列を作成
  const fingerprint = `${navigator.userAgent}-${
    Intl.DateTimeFormat().resolvedOptions().timeZone
  }`;

  // 固定のソルト（本来はユーザーごとに異なるべきだが、ログインがないので固定）
  const salt = "prompt-sync-editor-v1";
  const combined = fingerprint + salt;

  // SHA-256でハッシュ化
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(combined)
  );

  // CryptoKeyオブジェクトに変換
  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: CRYPTO_ALGORITHM },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * 文字列を暗号化してBase64エンコードされた文字列を返す
 */
export async function encryptValue(plaintext: string): Promise<string> {
  if (!plaintext) return "";

  try {
    const key = await getDerivedKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // ランダムなIV（初期化ベクトル）を生成
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // 暗号化
    const encryptedData = await crypto.subtle.encrypt(
      { name: CRYPTO_ALGORITHM, iv },
      key,
      data
    );

    // IV + 暗号化データを結合してBase64エンコード
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("暗号化エラー:", error);
    // 暗号化に失敗した場合は平文を返す（後方互換性）
    return plaintext;
  }
}

/**
 * Base64エンコードされた暗号化文字列を復号化
 */
export async function decryptValue(encrypted: string): Promise<string> {
  if (!encrypted) return "";

  try {
    const key = await getDerivedKey();

    // Base64デコード
    const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

    // IVと暗号化データを分離
    const iv = combined.slice(0, IV_LENGTH);
    const data = combined.slice(IV_LENGTH);

    // 復号化
    const decryptedData = await crypto.subtle.decrypt(
      { name: CRYPTO_ALGORITHM, iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error("復号化エラー（おそらく平文データ）:", error);
    // 復号化に失敗した場合は平文として返す（後方互換性）
    return encrypted;
  }
}

/**
 * LocalStorageに暗号化して保存
 */
export async function setEncryptedItem(
  key: string,
  value: string
): Promise<void> {
  const encrypted = await encryptValue(value);
  localStorage.setItem(key, encrypted);
}

/**
 * LocalStorageから復号化して取得
 */
export async function getEncryptedItem(key: string): Promise<string> {
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return "";
  return await decryptValue(encrypted);
}
