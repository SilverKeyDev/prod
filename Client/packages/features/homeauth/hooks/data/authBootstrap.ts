/**
 * Shared auth bootstrap logic for session verification and token refresh.
 * Platform-agnostic core that can be used by both web and mobile apps.
 * Uses platformStorage abstraction for storage operations.
 */

import { authUtils } from "packages/config/auth/auth";
import { secureLogger } from "packages/services/security/secureLogger";
import { dateNow } from "packages/utils/date";
import { getSessionStorage } from "packages/utils/storage/platformStorage";

import type { UserProfile } from "@/features/homeauth/types";

const BOOTSTRAP_KEY = "auth_bootstrap_started";

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

type SessionResult = Awaited<
  ReturnType<Awaited<typeof import("packages/config/http/api")>["authApi"]["verifySession"]>
>;

function applySessionResult(
  sessionResult: SessionResult,
  setters: AuthBootstrapSetters,
  requestId: string,
  currentPath: string,
  storage: AuthBootstrapStorage
): void {
  const { setStoreUser, setIsAuthenticated, setStoreAuthStatus } = setters;
  if (sessionResult.success && sessionResult.user) {
    const user = sessionResult.user;
    if ("created_at" in user && "is_active" in user) {
      secureLogger.info(
        "🔍 FRONTEND_AUTH_BOOTSTRAP_SUCCESS",
        "Session verified successfully, user authenticated",
        {
          requestId,
          userId: user.id,
          userEmail: user.email
            ? `${user.email.substring(0, 3)}***${user.email.substring(user.email.length - 3)}`
            : "missing",
          isAgent: user.is_agent || false,
          hasSubscription: user.has_subscription || false,
        }
      );
      setStoreUser(user as UserProfile);
      try {
        storage.setItem("auth_last_verify_at", String(Date.now()));
      } catch {
        /* ignore */
      }
    } else {
      secureLogger.warn("🔍 FRONTEND_AUTH_BOOTSTRAP_PARTIAL_USER", "Received partial user data", {
        requestId,
        userKeys: Object.keys(user),
        hasCreatedAt: "created_at" in user,
        hasIsActive: "is_active" in user,
      });
      setStoreUser(null);
    }
    setIsAuthenticated(true);
    setStoreAuthStatus("authenticated");
  } else {
    setStoreUser(null);
    setIsAuthenticated(false);
    setStoreAuthStatus("unauthenticated");
    secureLogger.info(
      "🔍 FRONTEND_AUTH_BOOTSTRAP_NO_SESSION",
      "No valid session found - user is not authenticated",
      {
        requestId,
        sessionSuccess: sessionResult.success,
        hasUser: !!sessionResult.user,
        currentPath,
      }
    );
  }
}

async function verifyAndApplySession(
  requestId: string,
  currentPath: string,
  isPublicRoute: boolean,
  setters: AuthBootstrapSetters,
  storage: AuthBootstrapStorage
): Promise<void> {
  const { authApi } = await import("packages/config/http/api");
  secureLogger.info(
    "🔍 FRONTEND_AUTH_BOOTSTRAP_VERIFYING",
    "Verifying session with server (all routes)",
    { requestId, currentPath, isPublicRoute }
  );
  const verifyStart = Date.now();
  let sessionResult = await authApi.verifySession();
  const verifyMs = Date.now() - verifyStart;
  secureLogger.info("🔍 FRONTEND_AUTH_VERIFY_RESPONSE", "Session verification response received", {
    requestId,
    success: sessionResult.success,
    hasUser: !!sessionResult.user,
    durationMs: verifyMs,
  });

  if (!sessionResult.success) {
    secureLogger.info(
      "🔍 FRONTEND_AUTH_SESSION_INVALID",
      "Session invalid, attempting silent refresh",
      { requestId, currentPath }
    );
    const refreshResult = await authApi.refreshToken();
    if (refreshResult.success) {
      secureLogger.info(
        "🔍 FRONTEND_AUTH_REFRESH_SUCCESS",
        "Token refresh successful, retrying session verification",
        { requestId }
      );
      sessionResult = await authApi.verifySession();
    } else {
      secureLogger.info(
        "🔍 FRONTEND_AUTH_REFRESH_FAILED",
        "Token refresh failed, user must log in",
        { requestId, error: refreshResult.error }
      );
    }
  }

  applySessionResult(sessionResult, setters, requestId, currentPath, storage);
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

  secureLogger.info(
    "🔍 FRONTEND_AUTH_BOOTSTRAP_START",
    "Starting auth bootstrap (always verifying session)",
    {
      requestId,
      currentPath,
      isPublicRoute,
      timestamp: dateNow().toISOString(),
    }
  );
  setStoreAuthStatus("checking");
  setStoreAuthReady(false);
  try {
    await verifyAndApplySession(requestId, currentPath, isPublicRoute, setters, storage);
  } catch (error) {
    const err = error as Error;
    secureLogger.error("🔍 FRONTEND_AUTH_BOOTSTRAP_ERROR", "Auth bootstrap failed with error", {
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
    secureLogger.info("🔍 FRONTEND_AUTH_BOOTSTRAP_COMPLETE", "Auth bootstrap finished", {
      requestId,
      currentPath,
      finalStatus: getAuthStatusRef(),
      authReady: true,
    });
  }
}
