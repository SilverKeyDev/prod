/**
 * Shared auth bootstrap logic for session verification and token refresh.
 * Platform-agnostic core that can be used by both web and mobile apps.
 * Uses platformStorage abstraction for storage operations.
 */

import { authUtils } from "packages/config/auth/auth";
import type { SessionVerifyResult } from "packages/features/homeauth/api/handlers/session";
import { log } from "packages/logger";
import { dateNow } from "packages/utils/core/date";
import { getSessionStorage } from "packages/utils/core/storage/platformStorage";

import type { UserProfile } from "@/features/homeauth/types";

const BOOTSTRAP_KEY = "auth_bootstrap_started";
const BOOTSTRAP_RETRY_DELAYS_MS = [500, 1000] as const;
const BOOTSTRAP_MAX_ATTEMPTS = 3;

export type AuthBootstrapSetters = {
  setStoreAuthStatus: (s: "checking" | "authenticated" | "unauthenticated") => void;
  setStoreAuthReady: (ready: boolean) => void;
  setStoreUser: (user: UserProfile | null) => void;
  setIsAuthenticated: (v: boolean) => void;
  getAuthStatusRef: () => string;
};

export type AuthBootstrapStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function isCompleteUserProfile(user: unknown): user is UserProfile {
  return !!user && typeof user === "object" && "created_at" in user && "is_active" in user;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applySessionResult(
  sessionResult: SessionVerifyResult,
  setters: AuthBootstrapSetters,
  requestId: string,
  currentPath: string,
  storage: AuthBootstrapStorage
): void {
  const { setStoreUser, setIsAuthenticated, setStoreAuthStatus } = setters;

  if (sessionResult.success) {
    if (!sessionResult.user || !isCompleteUserProfile(sessionResult.user)) {
      log.warn("AUTH", "Auth bootstrap incomplete user profile", {
        requestId,
        currentPath,
        hasUser: !!sessionResult.user,
      });
      setStoreUser(null);
      setIsAuthenticated(false);
      setStoreAuthStatus("unauthenticated");
      return;
    }

    const user = sessionResult.user;
    log.info("AUTH", "Auth bootstrap success", {
      requestId,
      userId: user.id,
      userEmail: user.email
        ? `${user.email.substring(0, 3)}***${user.email.substring(user.email.length - 3)}`
        : "missing",
      isAgent: (user.roles ?? []).includes("agent"),
    });
    setStoreUser(user);
    try {
      storage.setItem("auth_last_verify_at", String(Date.now()));
    } catch {
      /* ignore */
    }
    setIsAuthenticated(true);
    setStoreAuthStatus("authenticated");
    return;
  }

  setStoreUser(null);
  setIsAuthenticated(false);
  setStoreAuthStatus("unauthenticated");
  log.info("AUTH", "Auth bootstrap no session", {
    requestId,
    sessionSuccess: sessionResult.success,
    transient: sessionResult.transient,
    hasUser: !!sessionResult.user,
    currentPath,
  });
}

async function attemptVerifyAndRefresh(
  _requestId: string,
  _currentPath: string,
  _isPublicRoute: boolean
): Promise<SessionVerifyResult> {
  const { authApi } = await import("packages/config/http/api");

  let sessionResult = await authApi.verifySession();

  if (sessionResult.success) {
    return sessionResult;
  }

  if (sessionResult.transient) {
    return sessionResult;
  }

  const refreshResult = await authApi.refreshToken();
  if (refreshResult.transient) {
    return { success: false, transient: true };
  }
  if (refreshResult.success) {
    sessionResult = await authApi.verifySession();
    return sessionResult;
  }

  return sessionResult;
}

async function verifyAndApplySession(
  requestId: string,
  currentPath: string,
  isPublicRoute: boolean,
  setters: AuthBootstrapSetters,
  storage: AuthBootstrapStorage
): Promise<void> {
  for (let attempt = 1; attempt <= BOOTSTRAP_MAX_ATTEMPTS; attempt++) {
    const sessionResult = await attemptVerifyAndRefresh(requestId, currentPath, isPublicRoute);

    if (sessionResult.success) {
      applySessionResult(sessionResult, setters, requestId, currentPath, storage);
      return;
    }

    if (sessionResult.transient && attempt < BOOTSTRAP_MAX_ATTEMPTS) {
      const delay = BOOTSTRAP_RETRY_DELAYS_MS[attempt - 1] ?? 1000;
      log.warn("AUTH", "Auth bootstrap retry", {
        requestId,
        attempt,
        delayMs: delay,
      });
      await sleep(delay);
      continue;
    }

    applySessionResult(sessionResult, setters, requestId, currentPath, storage);
    return;
  }
}

/**
 * Core auth bootstrap function - platform-agnostic session verification.
 * This function handles session verification, token refresh, and store updates.
 * Storage operations are abstracted via the storage parameter.
 *
 * @param currentPath - Current route path (for logging)
 * @param setters - Store setter functions for updating auth state
 * @param storage - Storage interface for bootstrap key and auth timestamp tracking
 * @returns Promise that resolves when bootstrap is complete
 */
export async function runAuthBootstrap(
  currentPath: string,
  setters: AuthBootstrapSetters,
  storage: AuthBootstrapStorage = getSessionStorage()
): Promise<void> {
  const requestId = `bootstrap_${dateNow().valueOf()}_${Math.random().toString(36).substr(2, 9)}`;
  const isPublicRoute = authUtils.isPublicRoute(currentPath);
  const {
    setStoreAuthStatus,
    setStoreAuthReady,
    setStoreUser,
    setIsAuthenticated,
    getAuthStatusRef,
  } = setters;

  log.info("AUTH", "Auth bootstrap start", {
    requestId,
    currentPath,
    isPublicRoute,
    timestamp: dateNow().toISOString(),
  });
  setStoreAuthStatus("checking");
  setStoreAuthReady(false);
  try {
    await verifyAndApplySession(requestId, currentPath, isPublicRoute, setters, storage);
  } catch (error) {
    const err = error as Error;
    log.error("AUTH", "Auth bootstrap error", {
      requestId,
      currentPath,
      error: err?.message || "Unknown error",
      errorType: err?.constructor?.name || "Unknown",
      stack: err?.stack?.substring(0, 200) || "No stack trace",
    });
    setStoreUser(null);
    setIsAuthenticated(false);
    setStoreAuthStatus("unauthenticated");
  } finally {
    setStoreAuthReady(true);
    try {
      storage.removeItem(BOOTSTRAP_KEY);
    } catch {
      /* ignore */
    }
    log.info("AUTH", "Auth bootstrap complete", {
      requestId,
      currentPath,
      finalStatus: getAuthStatusRef(),
      authReady: true,
    });
  }
}
