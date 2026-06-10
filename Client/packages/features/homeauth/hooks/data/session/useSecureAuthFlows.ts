import { authApi, getEnv } from "packages/config";
import {
  clearSessionStorageForLogout,
  getOptionalSessionStorageForLogout,
} from "packages/features/homeauth/hooks/data/utils/logoutCleanup";
import { mergeSessionRefreshUserIntoAuthProfile } from "packages/features/homeauth/hooks/data/utils/mergeAuthUserProfile";
import {
  mapAuthResponseToUserProfile,
  toUserStoreProfile,
} from "packages/features/homeauth/hooks/data/utils/userMapping";
import { log } from "packages/logger";
import { applyLocalUnauthenticatedState } from "packages/services/http/client/auth";
import {
  isTransientRefreshFailure,
  postRefreshTokenWithRetry,
} from "packages/services/http/client/auth/refreshTokenRetry";
import { reportSecurityEvent } from "packages/services/security/errorReporting";
import { resetWorkspaceStore, useDevAppPersonaStore } from "packages/store";
import { asError, getWindow } from "packages/utils";
import { resolveUserFacingMessage } from "packages/utils/core/errorHandling";

import type { UserProfile } from "@/features/homeauth/types";

const REFRESH_AFTER_VERIFY_COOLDOWN_MS = 90_000;

function clearAuthStateAfterRefreshFailure(setters: RefreshSetters): void {
  setters.setAccessToken(null);
  setters.setUser(null);
  setters.setStoreUser(null);
  setters.setStoreIsAuthenticated(false);
  setters.setStoreAuthStatus("unauthenticated");
  applyLocalUnauthenticatedState();
  resetWorkspaceStore();
  useDevAppPersonaStore.setState({ serverIdentityTouched: false });
}

type LoginSetters = {
  setUser: (u: UserProfile | null) => void;
  setError: (e: string | null) => void;
  setNeedsVerification: (v: boolean) => void;
  setAccessToken: (t: string | null) => void;
  setIsLoading: (v: boolean) => void;
  setStoreUser: (u: UserProfile | null) => void;
  setStoreIsAuthenticated: (v: boolean) => void;
  setStoreAuthStatus: (s: string) => void;
  setStoreAuthReady: (v: boolean) => void;
  setUserProfile: (p: unknown) => void;
  setLoginRef: (v: boolean) => void;
};

function applyLoginSuccess(
  response: Awaited<ReturnType<typeof authApi.login>>,
  setters: LoginSetters
): void {
  const {
    setUser,
    setAccessToken,
    setStoreUser,
    setStoreIsAuthenticated,
    setStoreAuthStatus,
    setStoreAuthReady,
    setUserProfile,
    setLoginRef,
  } = setters;
  setAccessToken("authenticated");
  log.info("AUTH", "Authentication successful via HTTP-only cookies", {
    storageMethod: "http_only_cookies",
    authMethod: "cookie_based",
    note: "All tokens in secure HTTP-only cookies",
  });
  if (response.user) {
    const mappedUser = mapAuthResponseToUserProfile(response.user, response.user_sub);
    const userStoreProfile = toUserStoreProfile(mappedUser);
    if (getEnv().isDevelopment) {
      log.debug("AUTH", "User mapping", {
        responseUserId: response.user.id,
        responseUserSub: "user_sub" in response.user ? response.user.user_sub : undefined,
        responseUserSubTop: response.user_sub,
        finalUserId: mappedUser.id,
        email: response.user.email,
        name: response.user.name,
      });
    }
    setUser(mappedUser);
    setStoreUser(mappedUser);
    setStoreIsAuthenticated(true);
    setStoreAuthStatus("authenticated");
    setStoreAuthReady(true);
    setUserProfile(userStoreProfile);
    if (getEnv().isDevelopment) {
      log.debug("AUTH", "User state after login", {
        localUser: mappedUser,
        localUserId: mappedUser.id,
        localUserEmail: mappedUser.email,
      });
    }
  } else {
    setStoreIsAuthenticated(true);
    setStoreAuthStatus("authenticated");
    setStoreAuthReady(true);
  }
  setLoginRef(false);
  if (getEnv().isDevelopment) {
    log.security("AUTH", "Auth state updated synchronously", {
      authenticated: true,
      hasUser: !!response.user,
      authMethod: "http-only-cookies",
    });
    log.security("AUTH", "Login successful", {
      userId:
        response.user?.id ??
        (response.user && "user_sub" in response.user ? response.user.user_sub : undefined),
    });
  }
}

export async function performLogin(
  email: string,
  password: string,
  setters: LoginSetters
): Promise<{ success: boolean; needsVerification?: boolean }> {
  const { setError, setNeedsVerification, setIsLoading, setLoginRef } = setters;
  setLoginRef(true);
  setIsLoading(true);
  setError(null);
  try {
    const response = await authApi.login({ email, password });
    if (response.success) {
      applyLoginSuccess(response, setters);
      return { success: true };
    }
    if (response.needs_verification) {
      const sess = getOptionalSessionStorageForLogout();
      if (sess) {
        sess.setItem("signupEmail", email);
        sess.setItem("signupPassword", password);
      }
      setNeedsVerification(true);
      setError(response.message ?? "Please verify your email address to continue.");
      setLoginRef(false);
      return { success: false, needsVerification: true };
    }
    setNeedsVerification(false);
    setError(
      resolveUserFacingMessage(response, {
        fallbackMessage: response.message ?? "Login failed",
      })
    );
    setLoginRef(false);
    return { success: false };
  } catch (err: unknown) {
    const userMessage = resolveUserFacingMessage(err, { fallbackMessage: "Login failed" });
    setError(userMessage);
    reportSecurityEvent({
      type: "authentication_failure",
      severity: "high",
      description: "Secure login attempt failed",
      metadata: { email, error: userMessage },
    });
    setLoginRef(false);
    return { success: false };
  } finally {
    setIsLoading(false);
  }
}

type LogoutSetters = {
  setAccessToken: (t: string | null) => void;
  setUser: (u: UserProfile | null) => void;
  setStoreUser: (u: UserProfile | null) => void;
  setStoreIsAuthenticated: (v: boolean) => void;
  setStoreAuthStatus: (s: string) => void;
  setStoreAuthReady: (v: boolean) => void;
  setUserProfile: (p: null) => void;
};

export async function performLogout(setters: LogoutSetters): Promise<void> {
  log.info("AUTH", "Logout initiated");
  try {
    await authApi.logout();
    log.info("AUTH", "Server logout successful");
  } catch (error) {
    log.warn("AUTH", "Server logout failed, continuing with client cleanup", {
      error: asError(error).message,
    });
  }
  const {
    setAccessToken,
    setUser,
    setStoreUser,
    setStoreIsAuthenticated,
    setStoreAuthStatus,
    setStoreAuthReady,
    setUserProfile,
  } = setters;
  setAccessToken(null);
  setUser(null);
  setStoreUser(null);
  setStoreIsAuthenticated(false);
  setStoreAuthStatus("unauthenticated");
  setStoreAuthReady(false);
  setUserProfile(null);
  resetWorkspaceStore();
  useDevAppPersonaStore.setState({ serverIdentityTouched: false });
  clearSessionStorageForLogout();
  log.security("AUTH", "User logged out - HTTP-only cookies cleared by server");
  log.info("AUTH", "Logout complete, navigating to /login");
  const win = getWindow();
  if (win) win.location.href = "/login";
}

type RefreshSetters = {
  setAccessToken: (t: string | null) => void;
  setUser: (u: UserProfile | null) => void;
  setStoreUser: (u: UserProfile | null) => void;
  setStoreIsAuthenticated: (v: boolean) => void;
  setStoreAuthStatus: (s: string) => void;
  currentUser: UserProfile | null;
};

export async function performRefreshToken(setters: RefreshSetters): Promise<boolean> {
  const sess = getOptionalSessionStorageForLogout();
  const lastVerifyAt = sess?.getItem("auth_last_verify_at") ?? null;
  if (lastVerifyAt) {
    const elapsed = Date.now() - parseInt(lastVerifyAt, 10);
    if (elapsed < REFRESH_AFTER_VERIFY_COOLDOWN_MS) {
      log.debug("AUTH", "Skipping token refresh (within cooldown after session verify)", {
        elapsedMs: elapsed,
        cooldownMs: REFRESH_AFTER_VERIFY_COOLDOWN_MS,
      });
      return true;
    }
  }
  log.info("AUTH", "Attempting token refresh");
  try {
    const attempt = await postRefreshTokenWithRetry();
    if (attempt.success && attempt.body) {
      const response = attempt.body as {
        success?: boolean;
        user?: Record<string, unknown>;
        user_sub?: string;
      };
      if (response.success) {
        setters.setAccessToken("authenticated");
        if (response.user) {
          const prev = setters.currentUser;
          const nextUser = prev
            ? mergeSessionRefreshUserIntoAuthProfile(prev, response.user)
            : mapAuthResponseToUserProfile(response.user, response.user_sub);
          setters.setUser(nextUser);
          setters.setStoreUser(nextUser);
        }
        log.info("AUTH", "Token refresh successful");
        return true;
      }
    }

    if (isTransientRefreshFailure(attempt)) {
      log.warn("AUTH", "Token refresh transient failure (will retry on next cycle)", {
        status: attempt.status,
      });
      return false;
    }

    const errorCode =
      typeof attempt.body?.error === "string" ? attempt.body.error : "REFRESH_FAILED";
    log.warn("AUTH", "Token refresh failed - clearing auth state", {
      error: errorCode,
    });
    clearAuthStateAfterRefreshFailure(setters);
    return false;
  } catch (error) {
    log.error("AUTH", "Token refresh exception", {
      error: asError(error).message,
    });
    clearAuthStateAfterRefreshFailure(setters);
    return false;
  }
}
