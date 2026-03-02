import { log, LOG_CATEGORIES } from "packages/logger";
import { getFetch, getWindow } from "packages/utils/platform";
import { getLocalStorage } from "packages/utils/storage/platformStorage";

import type { AuthenticationError } from "./errors";

let verifyingPromise: Promise<{ success?: boolean } | null> | null = null;
let lastAuthEventAt = 0;
const AUTH_COOLDOWN_MS = 3000;

export function isAuthEndpoint(url: string): boolean {
  return /\/api\/v1\/(auth\/(verify|login|logout|refresh-token)|user\/profile)/.test(url);
}

let authBroadcastChannel: BroadcastChannel | null = null;

export function getAuthBC(): BroadcastChannel | null {
  if (authBroadcastChannel) return authBroadcastChannel;
  try {
    authBroadcastChannel = new BroadcastChannel("auth");
  } catch {
    authBroadcastChannel = null;
  }
  return authBroadcastChannel;
}

/**
 * Minimal 401 handler using raw fetch to avoid importing config/api (which would
 * create a circular dependency: http → config/api/auth → handlers → http).
 */
export function handle401Unauthorized(_url: string): void {
  const now = Date.now();
  if (verifyingPromise || now - lastAuthEventAt <= AUTH_COOLDOWN_MS) return;
  lastAuthEventAt = now;

  const opts: RequestInit = { credentials: "include", method: "POST" };
  const getOpts: RequestInit = { credentials: "include", method: "GET" };

  const doFetch = getFetch();
  verifyingPromise = doFetch("/api/v1/auth/refresh-token", opts)
    .then((r) => (r.ok ? r.json() : { success: false }))
    .then((refreshResult: { success?: boolean }) =>
      refreshResult.success === true
        ? doFetch("/api/v1/user/profile", getOpts).then((r) =>
            r.ok ? r.json() : { success: false }
          )
        : Promise.resolve({ success: false })
    )
    .then((v: { success?: boolean }) => v ?? { success: false })
    .catch(() => null)
    .finally(() => {
      verifyingPromise = null;
    });

  void void verifyingPromise.then((v) => {
    if (!v?.success) {
      try {
        getAuthBC()?.postMessage({ type: "logout" });
      } catch {
        /* ignore */
      }
    }
  });
}

export function handleAuthenticationError(error: AuthenticationError): void {
  log.security(LOG_CATEGORIES.AUTH, "Authentication error detected", {
    errorCode: error.errorCode,
    message: error.message,
  });

  try {
    const local = getLocalStorage();
    local.removeItem("access_token");
    local.removeItem("token");
    local.removeItem("user");
  } catch {
    /* ignore */
  }

  try {
    const authErrorEvent = new CustomEvent("authenticationError", {
      detail: { errorCode: error.errorCode, message: error.message },
    });
    const win = getWindow();
    setTimeout(() => {
      try {
        if (win) win.dispatchEvent(authErrorEvent);
      } catch (dispatchError) {
        log.warn(LOG_CATEGORIES.HTTP, "Authentication error event dispatch failed", dispatchError);
      }
    }, 0);
  } catch {
    /* ignore */
  }

  try {
    const bc = new BroadcastChannel("auth");
    bc.postMessage({ type: "logout" });
  } catch {
    /* ignore */
  }

  setTimeout(() => {
    const win = getWindow();
    if (win) win.location.href = "/login";
  }, 100);
}
