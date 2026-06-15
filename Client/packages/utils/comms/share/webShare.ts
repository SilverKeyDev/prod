import { log } from "packages/logger";
import { getNavigator } from "packages/utils/core/platform";

export type WebShareResult = "shared" | "aborted" | "unavailable";

/**
 * Invokes the Web Share API with arbitrary {@link ShareData} (URL, text, and/or files).
 * Returns whether the system handled share, user aborted, or share is unavailable/failed.
 */
export async function tryWebShare(shareData: ShareData): Promise<WebShareResult> {
  const nav = getNavigator();
  if (!nav?.share || typeof nav.share !== "function") {
    return "unavailable";
  }
  try {
    await nav.share(shareData);
    return "shared";
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return "aborted";
    }
    log.warn("PAGES", "Web Share API share failed", err);
    return "unavailable";
  }
}
