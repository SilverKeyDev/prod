import { log, LOG_CATEGORIES } from "packages/logger";
import { getFetch, getWindow } from "packages/utils/platform";
import { getLocalStorage } from "packages/utils/storage/platformStorage";

import type { AuthenticationError } from "./errors";
import { createHttpRequestId } from "./requestId";

let verifyingPromise: Promise<boolean> | null = null;

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

async function executeRefreshRecoveryChain(correlationId: string): Promise<boolean> {
  const opts: RequestInit = {
    credentials: "include",
    method: "POST",
    headers: { "X-Request-ID": correlationId },
  };
  const getOpts: RequestInit = {
    credentials: "include",
    method: "GET",
    headers: { "X-Request-ID": correlationId },
  };

  const doFetch = getFetch();
  try {
    const refreshRes = await doFetch("/api/v1/auth/refresh-token", opts);
    const refreshResult: { success?: boolean } = refreshRes.ok
      ? await refreshRes.json()
      : { success: false };

    if (refreshResult.success !== true) {
      log.warn(LOG_CATEGORIES.AUTH, "401 recovery: refresh-token did not succeed", {
        correlationId,
      });
      return false;
    }

    const profileRes = await doFetch("/api/v1/user/profile", getOpts);
    const profileJson: { success?: boolean } = profileRes.ok
      ? await profileRes.json()
      : { success: false };

    const recovered = profileJson.success === true;
    if (!recovered) {
      log.warn(LOG_CATEGORIES.AUTH, "401 recovery: profile verification failed after refresh", {
        correlationId,
      });
    }
    return recovered;
  } catch {
    log.warn(LOG_CATEGORIES.AUTH, "401 recovery: refresh chain threw", { correlationId });
    return false;
  }
}

/**
 * Cookie/session recovery after a 401 using raw fetch (no config/api cycle).
 *
 * IMPORTANT: callers must await this and retry their request once on `true`.
 * Previous fire-and-forget behavior caused harmless 401 races (burst of requests after
 * onboarding/navigation) to throw AuthenticationError immediately and redirect to `/login`.
 */
export async function recoverSessionAfter401(): Promise<boolean> {
  if (verifyingPromise !== null) {
    return verifyingPromise;
  }

  const correlationId = createHttpRequestId();

  verifyingPromise = (async () => {
    const ok = await executeRefreshRecoveryChain(correlationId);
    if (!ok) {
      log.warn(LOG_CATEGORIES.AUTH, "401 recovery refresh chain failed; broadcasting logout", {
        correlationId,
      });
      try {
        getAuthBC()?.postMessage({ type: "logout" });
      } catch {
        /* ignore */
      }
    }
    return ok;
  })().finally(() => {
    verifyingPromise = null;
  });

  return verifyingPromise;
}

/** @deprecated Use recoverSessionAfter401 (awaited + retry pattern). */
export function handle401Unauthorized(_url: string): void {
  void recoverSessionAfter401();
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
