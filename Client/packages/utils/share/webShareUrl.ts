import type { WebShareResult } from "./webShare";
import { tryWebShare } from "./webShare";

export type WebShareUrlResult = WebShareResult;

/**
 * Invokes the Web Share API with URL (and optional title/text).
 * Returns whether the system handled share, user aborted, or share is unavailable/failed.
 */
export async function tryWebShareUrl(data: {
  url: string;
  title?: string;
  text?: string;
}): Promise<WebShareUrlResult> {
  return tryWebShare(data);
}
