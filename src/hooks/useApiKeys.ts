import { useState, useEffect } from "react";
import type { ApiKeys } from "../types";
import {
  setEncryptedItem,
  getEncryptedItem,
  setEncryptedSessionItem,
  getEncryptedSessionItem,
} from "../crypto";

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    gemini: "",
    openai: "",
    claude: "",
  });

  const [saveToLocalStorage, setSaveToLocalStorage] = useState(() => {
    return localStorage.getItem("api_keys_persist") === "true";
  });

  // Load encrypted API keys on mount
  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const [geminiLocal, openaiLocal, claudeLocal] = await Promise.all([
          getEncryptedItem("gemini_api_key"),
          getEncryptedItem("openai_api_key"),
          getEncryptedItem("claude_api_key"),
        ]);

        const [geminiSession, openaiSession, claudeSession] = await Promise.all(
          [
            getEncryptedSessionItem("gemini_api_key"),
            getEncryptedSessionItem("openai_api_key"),
            getEncryptedSessionItem("claude_api_key"),
          ]
        );

        const gemini = geminiSession || geminiLocal;
        const openai = openaiSession || openaiLocal;
        const claude = claudeSession || claudeLocal;

        setApiKeys({ gemini, openai, claude });
      } catch (error) {
        console.error("APIキーの読み込みエラー:", error);
      }
    };

    loadApiKeys();
  }, []);

  const saveApiKeys = async (keys: ApiKeys) => {
    try {
      if (saveToLocalStorage) {
        await Promise.all([
          setEncryptedItem("gemini_api_key", keys.gemini),
          setEncryptedItem("openai_api_key", keys.openai),
          setEncryptedItem("claude_api_key", keys.claude),
        ]);
        sessionStorage.removeItem("gemini_api_key");
        sessionStorage.removeItem("openai_api_key");
        sessionStorage.removeItem("claude_api_key");
        localStorage.setItem("api_keys_persist", "true");
      } else {
        await Promise.all([
          setEncryptedSessionItem("gemini_api_key", keys.gemini),
          setEncryptedSessionItem("openai_api_key", keys.openai),
          setEncryptedSessionItem("claude_api_key", keys.claude),
        ]);
        localStorage.removeItem("gemini_api_key");
        localStorage.removeItem("openai_api_key");
        localStorage.removeItem("claude_api_key");
        localStorage.setItem("api_keys_persist", "false");
      }

      setApiKeys(keys);
      return true;
    } catch (error) {
      console.error("APIキーの保存エラー:", error);
      return false;
    }
  };

  return {
    apiKeys,
    setApiKeys,
    saveApiKeys,
    saveToLocalStorage,
    setSaveToLocalStorage,
  };
};
