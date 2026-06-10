import { log } from "packages/logger";
import { normalizeUrl } from "packages/services/http/client/request/httpRequestHeaders";
import { createHttpRequestId } from "packages/services/http/client/request/requestId";
import { getFetch, getWindow } from "packages/utils/core/platform";

import { broadcastAuthLogout } from "./authBroadcast";
import { postRefreshTokenWithRetry } from "./refreshTokenRetry";

let verifyingPromise: Promise<boolean> | null = null;

export function isAuthEndpoint(url: string): boolean {
  return /\/api\/v1\/(auth\/(verify|login|logout|refresh-token)|user\/profile)/.test(url);
}

async function executeRefreshRecoveryChain(correlationId: string): Promise<boolean> {
  const getOpts: RequestInit = {
    credentials: "include",
    method: "GET",
    headers: { "X-Request-ID": correlationId },
  };

  const doFetch = getFetch();
  const { getEnv } = await import("packages/config/env");
  const configuredBase = normalizeUrl(getEnv().apiBaseUrl.replace(/\/+$/, ""));
  const withBase = (path: string): string =>
    path.startsWith("http") || configuredBase === "" ? path : `${configuredBase}${path}`;

  try {
    const refreshResult = await postRefreshTokenWithRetry(3, correlationId);
    if (!refreshResult.success) {
      log.warn("AUTH", "401 recovery: refresh-token did not succeed", {
        correlationId,
        status: refreshResult.status,
        retryable: refreshResult.retryable,
      });
      return false;
    }

    const profileRes = await doFetch(withBase("/api/v1/user/profile"), getOpts);
    const profileJson: { success?: boolean } = profileRes.ok
      ? await profileRes.json()
      : { success: false };

    const recovered = profileJson.success === true;
    if (!recovered) {
      log.warn("AUTH", "401 recovery: profile verification failed after refresh", {
        correlationId,
      });
    }
    return recovered;
  } catch {
    log.warn("AUTH", "401 recovery: refresh chain threw", { correlationId });
    return false;
  }
}

function notifySessionRecoveryFailed(): void {
  try {
    getWindow()?.dispatchEvent(new CustomEvent("authenticationError", { detail: {} }));
  } catch {
    /* ignore */
  }
  broadcastAuthLogout();
}

/**
 * Cookie/session recovery after a 401 using raw fetch (no config/api cycle).
 *
 * IMPORTANT: callers must await this and retry their request once on `true`.
 */
export async function recoverSessionAfter401(): Promise<boolean> {
  if (verifyingPromise !== null) {
    return verifyingPromise;
  }

  const correlationId = createHttpRequestId();

  verifyingPromise = (async () => {
    const ok = await executeRefreshRecoveryChain(correlationId);
    if (!ok) {
      log.warn("AUTH", "401 recovery refresh chain failed; broadcasting logout", {
        correlationId,
      });
      notifySessionRecoveryFailed();
    }
    return ok;
  })().finally(() => {
    verifyingPromise = null;
  });

  return verifyingPromise;
}
