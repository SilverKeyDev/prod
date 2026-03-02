import type { AuthResponse } from "packages/features/homeauth/types";
import { log, LOG_CATEGORIES } from "packages/logger";
import { reportSecurityEvent } from "packages/services/security/errorReporting";
import { getDocument, getWindow } from "packages/utils/platform";

import type { UserProfile } from "@/features/homeauth/types";

const apiRequestOptions = {
  includeCredentials: true,
  includeAuth: false,
  useCors: false,
} as unknown as import("../../../../services/http/compatibility").ApiRequestOptions;

export async function verifySessionHandler(): Promise<AuthResponse> {
  const requestId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const doc = getDocument();
    const allCookies = doc
      ? doc.cookie
          .split(";")
          .map((c) => c.trim().split("=")[0])
          .filter(Boolean)
      : [];
    const { apiGet } = await import("../../../../services/http/compatibility");

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
      log.info(LOG_CATEGORIES.AUTH, "🔍 Session verification successful", {
        requestId,
        userId: user.id,
        userEmail: user.email
          ? `${user.email.substring(0, 3)}***${user.email.substring(user.email.length - 3)}`
          : "missing",
        isAgent: user.is_agent || false,
        cookieCountBefore: allCookies.length,
        cookieCountAfter: cookiesAfter.length,
        newCookies: newCookies.length > 0 ? newCookies : undefined,
      });

      return { success: true, user };
    }

    log.info(LOG_CATEGORIES.AUTH, "🔍 No valid session found", {
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

    log.error(LOG_CATEGORIES.AUTH, "🔍 Session verification failed with error", {
      requestId,
      error: err?.message || "Unknown error",
      errorType: err?.constructor?.name || "Unknown",
      cookiesAfterError,
      cookieCountAfterError: cookiesAfterError.length,
      currentUrl: win?.location.href,
    });
    return { success: false };
  }
}

export async function refreshTokenHandler(): Promise<AuthResponse> {
  const requestId = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    log.info(LOG_CATEGORIES.AUTH, "Starting token refresh", { requestId });

    const { apiPost } = await import("../../../../services/http/compatibility");

    const response = await apiPost<AuthResponse>(
      "/api/v1/auth/refresh-token",
      {},
      apiRequestOptions
    );

    if (response.success) {
      log.info(LOG_CATEGORIES.AUTH, "Token refresh successful", {
        requestId,
        hasUser: !!response.user,
      });
    } else {
      log.warn(LOG_CATEGORIES.AUTH, "Token refresh failed", {
        requestId,
        error: response.error,
        message: response.message,
      });

      if (
        response.error === "REFRESH_TOKEN_EXPIRED" ||
        response.error === "REFRESH_TOKEN_INVALID"
      ) {
        reportSecurityEvent({
          type: "authentication_failure",
          severity: "medium",
          description: "Token refresh failed - refresh token expired or invalid",
          metadata: { error: response.error, requestId },
        });
      }
    }

    return response;
  } catch (error: unknown) {
    const err = error as Error;

    log.error(LOG_CATEGORIES.AUTH, "Token refresh request failed with exception", {
      requestId,
      error: err?.message || "Unknown error",
      errorType: err?.constructor?.name || "Unknown",
    });

    reportSecurityEvent({
      type: "authentication_failure",
      severity: "high",
      description: "Token refresh exception",
      metadata: { error: err?.message, requestId },
    });

    return {
      success: false,
      error: "REFRESH_FAILED",
      message: "Failed to refresh token. Please log in again.",
    };
  }
}
