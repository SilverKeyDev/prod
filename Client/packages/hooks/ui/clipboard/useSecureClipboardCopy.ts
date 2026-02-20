import { useCallback } from "react";

import { secureClipboardCopy } from "packages/services/security/clipboardSecurity";

/**
 * Returns a stable function to copy text to the clipboard securely.
 * Use this in components instead of importing the service directly (frontend architecture).
 */
export function useSecureClipboardCopy(): (text: string) => Promise<boolean> {
  return useCallback((text: string) => secureClipboardCopy(text), []);
}
