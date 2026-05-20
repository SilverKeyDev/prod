import { isProduction } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";

const STALE_CHUNK_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /loading chunk \d+ failed/i,
] as const;

/** True when the message matches a known stale lazy-chunk failure (post-deploy cache mismatch). */
export function isStaleLazyChunkMessage(message: string): boolean {
  return STALE_CHUNK_PATTERNS.some((pattern) => pattern.test(message));
}

export function isStaleLazyChunkError(error: unknown): boolean {
  if (error instanceof Error) {
    return isStaleLazyChunkMessage(error.message);
  }
  if (typeof error === "string") {
    return isStaleLazyChunkMessage(error);
  }
  return false;
}

let reloadAttempted = false;

/**
 * In production, reload the page once per session when a lazy chunk fails to load
 * (typically after a deploy while an old HTML shell references removed chunks).
 */
export function tryReloadForStaleChunkError(error: unknown, context: string): boolean {
  if (!isProduction || !isStaleLazyChunkError(error) || reloadAttempted) {
    return false;
  }
  reloadAttempted = true;
  log.info(LOG_CATEGORIES.ERRORS, "[PERF] Reloading for stale lazy chunk", { context });
  if (typeof location !== "undefined" && typeof location.reload === "function") {
    location.reload();
  }
  return true;
}

/** @internal test-only */
export function resetStaleChunkRecoveryStateForTests(): void {
  reloadAttempted = false;
}
