const CODE_LENGTH = 6;

/**
 * Apply a single digit change at index. Only digits allowed.
 * Returns next code array and index to focus.
 */
export function applyCodeChange(
  code: string[],
  value: string,
  index: number,
): { nextCode: string[]; nextFocusIndex: number } {
  const digitsOnly = value.replace(/\D/g, "");
  const char = digitsOnly.slice(-1) ?? "";
  const nextCode = [...code];
  nextCode[index] = char;

  let nextFocusIndex = index;
  if (char && index < CODE_LENGTH - 1) {
    nextFocusIndex = index + 1;
  } else if (index === CODE_LENGTH - 1 && nextCode.every((c) => c.length > 0)) {
    nextFocusIndex = CODE_LENGTH - 1;
  }

  return { nextCode, nextFocusIndex };
}

/**
 * Apply pasted string from startIndex. Only digits; max 6 chars.
 * Returns next code array and index to focus (next empty or 5).
 */
export function applyPaste(
  code: string[],
  pasteData: string,
  startIndex: number,
): { nextCode: string[]; nextFocusIndex: number } {
  const digitsOnly = pasteData.replace(/\D/g, "").slice(0, CODE_LENGTH);
  if (digitsOnly.length === 0) {
    return { nextCode: [...code], nextFocusIndex: startIndex };
  }

  const nextCode = [...code];
  const pasteChars = digitsOnly.split("");
  pasteChars.forEach((digit, i) => {
    if (startIndex + i < CODE_LENGTH) {
      nextCode[startIndex + i] = digit;
    }
  });

  const nextEmptyIndex = nextCode.findIndex((c) => !c);
  const nextFocusIndex =
    nextEmptyIndex === -1
      ? CODE_LENGTH - 1
      : Math.min(nextEmptyIndex, CODE_LENGTH - 1);

  return { nextCode, nextFocusIndex };
}

/**
 * For Backspace when current cell is empty: return the index to focus (previous cell), or null.
 */
export function getBackspaceFocusIndex(
  code: string[],
  index: number,
): number | null {
  if (index > 0 && !code[index]) {
    return index - 1;
  }
  return null;
}
