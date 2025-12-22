import { useState } from "react";
import type { HistoryState } from "../types";

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = (
    left: string,
    right: string,
    leftTokens: number,
    rightTokens: number
  ) => {
    const newState: HistoryState = {
      leftText: left,
      rightText: right,
      leftTokenCount: leftTokens,
      rightTokenCount: rightTokens,
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);

    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }

    setHistory(newHistory);
  };

  const undo = (): HistoryState | null => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      return history[newIndex];
    }
    return null;
  };

  const redo = (): HistoryState | null => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      return history[newIndex];
    }
    return null;
  };

  const clear = () => {
    setHistory([]);
    setHistoryIndex(-1);
  };

  return {
    history,
    historyIndex,
    saveToHistory,
    undo,
    redo,
    clear,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
};
