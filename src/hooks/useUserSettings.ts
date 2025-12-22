import { useState } from "react";
import type { UserSettings } from "../types";
import { DEFAULT_USER_SETTINGS } from "../constants";

export const useUserSettings = () => {
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem("user_settings");

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_USER_SETTINGS,
          ...parsed,
        };
      } catch {
        return DEFAULT_USER_SETTINGS;
      }
    }
    return DEFAULT_USER_SETTINGS;
  });

  const saveUserSettings = (settings: UserSettings) => {
    setUserSettings(settings);
    localStorage.setItem("user_settings", JSON.stringify(settings));
  };

  return {
    userSettings,
    setUserSettings,
    saveUserSettings,
  };
};
