import type { DiffResult } from "../types";

// Find differences between two texts (simple line-based diff)
export const findDifferences = (
  oldText: string,
  newText: string
): DiffResult | null => {
  if (oldText === newText) return null;

  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  // Find first different line (strict comparison including empty lines)
  let startLine = 0;
  while (
    startLine < Math.min(oldLines.length, newLines.length) &&
    oldLines[startLine] === newLines[startLine]
  ) {
    startLine++;
  }

  // Find last different line from the end
  let endLineOld = oldLines.length - 1;
  let endLineNew = newLines.length - 1;
  while (
    endLineOld >= startLine &&
    endLineNew >= startLine &&
    oldLines[endLineOld] === newLines[endLineNew]
  ) {
    endLineOld--;
    endLineNew--;
  }

  // Extract changed portion (preserve all lines including empty ones)
  // If lines were deleted, changedText might be empty
  const changedText = newLines.slice(startLine, endLineNew + 1).join("\n");

  // Return diff even if changedText is empty (for deletion cases)
  return {
    start: startLine,
    end: endLineNew,
    oldEnd: endLineOld,
    changedText,
  };
};
