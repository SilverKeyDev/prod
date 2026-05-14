import { authApi, getEnv } from "packages/config";
import {
  clearSessionStorageForLogout,
  getOptionalSessionStorageForLogout,
} from "packages/features/homeauth/hooks/data/utils/logoutCleanup";
import {
  mapAuthResponseToUserProfile,
  toUserStoreProfile,
} from "packages/features/homeauth/hooks/data/utils/userMapping";
import { log, LOG_CATEGORIES } from "packages/logger";
import { reportSecurityEvent } from "packages/services/security/errorReporting";
import { asError, getWindow } from "packages/utils";

import type { UserProfile } from "@/features/homeauth/types";

const REFRESH_AFTER_VERIFY_COOLDOWN_MS = 90_000;

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
  setStorePostAuthRedirectPath: (path: string | null) => void;
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
    setStorePostAuthRedirectPath,
    setUserProfile,
    setLoginRef,
  } = setters;
  setAccessToken("authenticated");
  log.info(LOG_CATEGORIES.AUTH, "Authentication successful via HTTP-only cookies", {
    storageMethod: "http_only_cookies",
    authMethod: "cookie_based",
    note: "All tokens in secure HTTP-only cookies",
  });
  if (response.user) {
    const mappedUser = mapAuthResponseToUserProfile(response.user, response.user_sub);
    const userStoreProfile = toUserStoreProfile(mappedUser);
    if (getEnv().isDevelopment) {
      log.debug(LOG_CATEGORIES.AUTH, "User mapping", {
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
    setStorePostAuthRedirectPath("/search");
    setUserProfile(userStoreProfile);
    if (getEnv().isDevelopment) {
      log.debug(LOG_CATEGORIES.AUTH, "User state after login", {
        localUser: mappedUser,
        localUserId: mappedUser.id,
        localUserEmail: mappedUser.email,
      });
    }
  } else {
    setStoreIsAuthenticated(true);
    setStoreAuthStatus("authenticated");
    setStoreAuthReady(true);
    setStorePostAuthRedirectPath("/search");
  }
  setLoginRef(false);
  if (getEnv().isDevelopment) {
    log.security(LOG_CATEGORIES.AUTH, "Auth state updated synchronously", {
      authenticated: true,
      hasUser: !!response.user,
      authMethod: "http-only-cookies",
    });
    log.security(LOG_CATEGORIES.AUTH, "Login successful", {
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
    setError(response.error ?? "Login failed");
    setLoginRef(false);
    return { success: false };
  } catch (err: unknown) {
    const errObj = asError(err);
    setError(errObj.message);
    reportSecurityEvent({
      type: "authentication_failure",
      severity: "high",
      description: "Secure login attempt failed",
      metadata: { email, error: errObj.message },
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
  setStorePostAuthRedirectPath: (path: string | null) => void;
  setUserProfile: (p: null) => void;
};

export async function performLogout(setters: LogoutSetters): Promise<void> {
  log.info(LOG_CATEGORIES.AUTH, "Logout initiated");
  try {
    await authApi.logout();
    log.info(LOG_CATEGORIES.AUTH, "Server logout successful");
  } catch (error) {
    log.warn(LOG_CATEGORIES.AUTH, "Server logout failed, continuing with client cleanup", {
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
    setStorePostAuthRedirectPath,
    setUserProfile,
  } = setters;
  setAccessToken(null);
  setUser(null);
  setStoreUser(null);
  setStoreIsAuthenticated(false);
  setStoreAuthStatus("unauthenticated");
  setStoreAuthReady(false);
  setStorePostAuthRedirectPath(null);
  setUserProfile(null);
  clearSessionStorageForLogout();
  log.security(LOG_CATEGORIES.AUTH, "User logged out - HTTP-only cookies cleared by server");
  log.info(LOG_CATEGORIES.AUTH, "Logout complete, navigating to /login");
  const win = getWindow();
  if (win) win.location.href = "/login";
}

type RefreshSetters = {
  setAccessToken: (t: string | null) => void;
  setUser: (u: UserProfile | null) => void;
  setStoreUser: (u: UserProfile | null) => void;
  setStoreIsAuthenticated: (v: boolean) => void;
  setStoreAuthStatus: (s: string) => void;
};

export async function performRefreshToken(setters: RefreshSetters): Promise<boolean> {
  const sess = getOptionalSessionStorageForLogout();
  const lastVerifyAt = sess?.getItem("auth_last_verify_at") ?? null;
  if (lastVerifyAt) {
    const elapsed = Date.now() - parseInt(lastVerifyAt, 10);
    if (elapsed < REFRESH_AFTER_VERIFY_COOLDOWN_MS) {
      log.debug(
        LOG_CATEGORIES.AUTH,
        "Skipping token refresh (within cooldown after session verify)",
        {
          elapsedMs: elapsed,
          cooldownMs: REFRESH_AFTER_VERIFY_COOLDOWN_MS,
        }
      );
      return true;
    }
  }
  log.info(LOG_CATEGORIES.AUTH, "Attempting token refresh");
  try {
    const { authApi: api } = await import("packages/config/http/api");
    const response = await api.refreshToken();
    if (response.success) {
      setters.setAccessToken("authenticated");
      if (response.user) {
        setters.setUser(response.user);
        setters.setStoreUser(response.user);
      }
      log.info(LOG_CATEGORIES.AUTH, "Token refresh successful");
      return true;
    }
    if (
      response.error === "REFRESH_TOKEN_EXPIRED" ||
      response.error === "REFRESH_TOKEN_INVALID" ||
      response.error === "REFRESH_TOKEN_MISSING"
    ) {
      log.warn(LOG_CATEGORIES.AUTH, "Refresh token expired or invalid - user must log in again", {
        error: response.error,
      });
      setters.setAccessToken(null);
      setters.setUser(null);
      setters.setStoreUser(null);
      setters.setStoreIsAuthenticated(false);
      setters.setStoreAuthStatus("unauthenticated");
    } else {
      log.warn(LOG_CATEGORIES.AUTH, "Token refresh failed", {
        error: response.error,
        message: response.message,
      });
    }
    return false;
  } catch (error) {
    log.error(LOG_CATEGORIES.AUTH, "Token refresh exception", {
      error: asError(error).message,
    });
    return false;
  }
}
