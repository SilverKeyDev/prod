/**
 * Secure clipboard operations
 */

import { log, LOG_CATEGORIES } from "packages/logger";
import { getDocument, getNavigator, getWindow } from "packages/utils/platform";

/**
 * Securely copy text to clipboard with fallback
 */
export async function secureClipboardCopy(text: string): Promise<boolean> {
  try {
    const nav = getNavigator();
    const win = getWindow();
    if (nav?.clipboard && win?.isSecureContext) {
      await nav.clipboard.writeText(text);
      return true;
    }
    const doc = getDocument();
    if (!doc?.body) return false;
    const textArea = doc.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    doc.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const result = doc.execCommand("copy");
    doc.body.removeChild(textArea);
    return result;
  } catch (error: unknown) {
    log.error(LOG_CATEGORIES.API, "Failed to copy to clipboard", error);
    return false;
  }
}
