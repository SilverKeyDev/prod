import { getEnv } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";
import { getWindow } from "packages/utils/platform";
import { getSessionStorage } from "packages/utils/storage/platformStorage";

/** sessionStorage: prevents infinite reload loops when recovery fails. */
export const STALE_DEPLOY_CHUNK_RELOAD_KEY = "silverkey-stale-chunk-reload";

const CHUNK_LOAD_ERROR_SUBSTRINGS = [
  "failed to fetch dynamically imported module",
  "importing a module script failed",
  "error loading dynamically imported module",
  "dynamically imported module",
] as const;

/** True when Vite/Rolldown lazy chunk fetch failed (often 404 after a prod deploy). */
export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : String(error);
  const normalized = message.toLowerCase();
  return CHUNK_LOAD_ERROR_SUBSTRINGS.some((fragment) => normalized.includes(fragment));
}

/** Clears the one-shot reload guard after a successful full page load. */
export function clearStaleDeployChunkReloadAttempt(): void {
  try {
    getSessionStorage().removeItem(STALE_DEPLOY_CHUNK_RELOAD_KEY);
  } catch {
    // ignore (private mode / blocked storage)
  }
}

function hasAlreadyAttemptedStaleChunkReload(): boolean {
  try {
    return getSessionStorage().getItem(STALE_DEPLOY_CHUNK_RELOAD_KEY) === "1";
  } catch {
    return false;
  }
}

function markStaleChunkReloadAttempted(): void {
  try {
    getSessionStorage().setItem(STALE_DEPLOY_CHUNK_RELOAD_KEY, "1");
  } catch {
    // ignore
  }
}

/**
 * Prod-only: reload once when a lazy route chunk 404s after deploy (stale tab / cached shell).
 * Returns true if a reload was started (caller should skip further error UI work).
 */
export function tryRecoverFromStaleDeployChunk(error: unknown): boolean {
  if (!getEnv().isProduction || !isChunkLoadError(error)) {
    return false;
  }
  if (hasAlreadyAttemptedStaleChunkReload()) {
    return false;
  }
  markStaleChunkReloadAttempted();
  log.info(LOG_CATEGORIES.ROUTING, "Reloading after stale deploy chunk load failure", {
    message: error instanceof Error ? error.message : String(error),
  });
  getWindow()?.location.reload();
  return true;
}

/** Prod-only: global listeners for Vite preload + unhandled dynamic import failures. */
export function registerStaleDeployChunkRecoveryListeners(): void {
  const win = getWindow();
  if (!getEnv().isProduction || !win) {
    return;
  }

  clearStaleDeployChunkReloadAttempt();

  win.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    tryRecoverFromStaleDeployChunk(
      new TypeError("Failed to fetch dynamically imported module (vite:preloadError)")
    );
  });

  win.addEventListener("unhandledrejection", (event) => {
    if (tryRecoverFromStaleDeployChunk(event.reason)) {
      event.preventDefault();
    }
  });
}
