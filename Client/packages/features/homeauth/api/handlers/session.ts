import type { AuthResponse } from "packages/features/homeauth/types";
import { log } from "packages/logger";
import { apiGet } from "packages/services/http/apiMethods";
import type { ApiRequestOptions } from "packages/services/http/apiRequest";
import { HttpError } from "packages/services/http/client";
import {
  isTransientRefreshFailure,
  postRefreshTokenWithRetry,
} from "packages/services/http/client/auth/refreshTokenRetry";
import { reportSecurityEvent } from "packages/services/security/errorReporting";
import { getDocument, getWindow } from "packages/utils/core/platform";

import type { UserProfile } from "@/features/homeauth/types";

const apiRequestOptions = {
  includeCredentials: true,
  includeAuth: false,
  useCors: false,
} as unknown as ApiRequestOptions;

export type SessionVerifyResult = AuthResponse & {
  transient?: boolean;
};

const TRANSIENT_HTTP_STATUSES = new Set([429, 502, 503, 504]);

function isTransientHttpError(error: unknown): boolean {
  if (error instanceof HttpError && TRANSIENT_HTTP_STATUSES.has(error.status)) {
    return true;
  }
  if (error instanceof Error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") return true;
    const msg = error.message.toLowerCase();
    if (msg.includes("network") || msg.includes("fetch")) return true;
  }
  return false;
}

function isExpectedLoggedOutRefreshFailure(errorMessage: string): boolean {
  const normalized = errorMessage.toUpperCase();
  return (
    normalized.includes("401") ||
    normalized.includes("UNAUTHORIZED") ||
    normalized.includes("REFRESH_TOKEN_MISSING") ||
    normalized.includes("NO VALID SESSION")
  );
}

function mapRefreshBodyToAuthResponse(body: Record<string, unknown> | null): AuthResponse {
  if (!body) {
    return { success: false, error: "REFRESH_FAILED" };
  }
  return {
    success: body.success === true,
    user: body.user as AuthResponse["user"],
    error: typeof body.error === "string" ? body.error : undefined,
    message: typeof body.message === "string" ? body.message : undefined,
    id_token: typeof body.id_token === "string" ? body.id_token : undefined,
    user_sub: typeof body.user_sub === "string" ? body.user_sub : undefined,
  };
}

export async function verifySessionHandler(): Promise<SessionVerifyResult> {
  const requestId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const doc = getDocument();
  const allCookies = doc
    ? doc.cookie
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean)
    : [];

  try {
    const response = await apiGet<AuthResponse & { data?: Record<string, unknown> }>(
      "/api/v1/user/profile",
      apiRequestOptions
    );

    const cookiesAfter = doc
      ? doc.cookie
          .split(";")
          .map((c) => c.trim().split("=")[0])
          .filter(Boolean)
      : [];

    const newCookies = cookiesAfter.filter((c) => !allCookies.includes(c));

    if (response.success && response.data) {
      const user = response.data as UserProfile;
      log.info("AUTH", "🔍 Session verification successful", {
        requestId,
        userId: user.id,
        userEmail: user.email
          ? `${user.email.substring(0, 3)}***${user.email.substring(user.email.length - 3)}`
          : "missing",
        isAgent: (user.roles ?? []).includes("agent"),
        cookieCountBefore: allCookies.length,
        cookieCountAfter: cookiesAfter.length,
        newCookies: newCookies.length > 0 ? newCookies : undefined,
      });

      return { success: true, user };
    }

    log.info("AUTH", "🔍 No valid session found", {
      requestId,
      responseSuccess: response.success,
      hasData: !!response.data,
      cookiesAfter,
      newCookies,
      cookieCountAfter: cookiesAfter.length,
    });
    return { success: false };
  } catch (error: unknown) {
    const err = error as Error;
    const docErr = getDocument();
    const cookiesAfterError = docErr
      ? docErr.cookie
          .split(";")
          .map((c) => c.trim().split("=")[0])
          .filter(Boolean)
      : [];
    const win = getWindow();
    const hadNoSession = allCookies.length === 0;
    const logPayload = {
      requestId,
      error: err?.message || "Unknown error",
      errorType: err?.constructor?.name || "Unknown",
      cookiesAfterError,
      cookieCountAfterError: cookiesAfterError.length,
      currentUrl: win?.location.href,
    };
    if (isTransientHttpError(error)) {
      log.warn("AUTH", "Session verification transient failure", logPayload);
      return { success: false, transient: true };
    }
    if (hadNoSession) {
      log.debug("AUTH", "🔍 Session verification: no session (expected)", logPayload);
    } else {
      log.error("AUTH", "🔍 Session verification failed with error", logPayload);
    }
    return { success: false };
  }
}

export async function refreshTokenHandler(): Promise<SessionVerifyResult> {
  const requestId = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const doc = getDocument();
  const cookieCountBefore = doc
    ? doc.cookie
        .split(";")
        .map((c) => c.trim().split("=")[0])
        .filter(Boolean).length
    : 0;

  try {
    log.info("AUTH", "Starting token refresh", { requestId });

    const attempt = await postRefreshTokenWithRetry(3, requestId);

    if (attempt.success && attempt.body) {
      const response = mapRefreshBodyToAuthResponse(attempt.body);
      if (response.success) {
        log.info("AUTH", "Token refresh successful", {
          requestId,
          hasUser: !!response.user,
        });
        return response;
      }
    }

    if (isTransientRefreshFailure(attempt)) {
      log.warn("AUTH", "Token refresh transient failure", { requestId });
      return { success: false, transient: true };
    }

    const mapped = mapRefreshBodyToAuthResponse(attempt.body);
    log.warn("AUTH", "Token refresh failed", {
      requestId,
      error: mapped.error,
      message: mapped.message,
    });

    if (mapped.error === "REFRESH_TOKEN_EXPIRED" || mapped.error === "REFRESH_TOKEN_INVALID") {
      reportSecurityEvent({
        type: "authentication_failure",
        severity: "medium",
        description: "Token refresh failed - refresh token expired or invalid",
        metadata: { error: mapped.error, requestId },
      });
    }

    return mapped;
  } catch (error: unknown) {
    const err = error as Error;
    const hadNoSession = cookieCountBefore === 0;
    const errorMessage = err?.message || "Unknown error";
    const expectedLoggedOutFailure =
      hadNoSession || isExpectedLoggedOutRefreshFailure(errorMessage);
    const logPayload = {
      requestId,
      error: errorMessage,
      errorType: err?.constructor?.name || "Unknown",
    };
    if (isTransientHttpError(error)) {
      log.warn("AUTH", "Token refresh transient exception", logPayload);
      return { success: false, transient: true };
    }
    if (expectedLoggedOutFailure) {
      log.debug("AUTH", "Token refresh: no session (expected)", logPayload);
    } else {
      log.error("AUTH", "Token refresh request failed with exception", logPayload);
      reportSecurityEvent({
        type: "authentication_failure",
        severity: "high",
        description: "Token refresh exception",
        metadata: { error: err?.message, requestId },
      });
    }
    return {
      success: false,
      error: "REFRESH_FAILED",
      message: "Failed to refresh token. Please log in again.",
    };
  }
}
