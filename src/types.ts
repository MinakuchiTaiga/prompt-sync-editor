// LLM Provider types
export type LLMProvider = "gemini" | "openai" | "claude";

// User Settings interface
export interface UserSettings {
  autoTranslate: boolean;
  translationDelay: number; // in milliseconds
}

// History state interface
export interface HistoryState {
  leftText: string;
  rightText: string;
  leftTokenCount: number;
  rightTokenCount: number;
}

// API Keys interface
export interface ApiKeys {
  gemini: string;
  openai: string;
  claude: string;
}

// Highlight interface
export interface Highlight {
  start: number;
  end: number;
  type: "added" | "removed";
}

// Diff result interface
export interface DiffResult {
  start: number;
  end: number;
  changedText: string;
  oldEnd: number;
}
