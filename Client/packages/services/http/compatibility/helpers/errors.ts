/**
 * Error and auth-error utilities for the compatibility layer
 */

import { log, LOG_CATEGORIES } from "packages/logger";
import { AuthenticationError, HttpError } from "packages/services/http/client";
import { log as secureLog } from "packages/services/security/secureLogger";
import { getWindow } from "packages/utils/platform";
import {
  getLocalStorage,
  getSessionStorage,
} from "packages/utils/storage/platformStorage";

export function logHttp(scope: string, e: unknown) {
  try {
    if (e instanceof AuthenticationError) {
      secureLog.security(scope, `Authentication error: ${e.errorCode}`, {
        message: e.message,
      });
    } else if (e instanceof HttpError) {
      secureLog.warn(scope, `HTTP ${e.status} error`, {
        status: e.status,
        url: e.url,
        body: e.bodyPreview,
      });
    } else if (e instanceof Error && e.name === "AbortError") {
      secureLog.debug(scope, "Request aborted");
    } else {
      secureLog.error(scope, "Unexpected HTTP error", e);
    }
  } catch (err: unknown) {
    log.error(LOG_CATEGORIES.HTTP, "Secure logger call failed", err);
  }
}

export function isAuthenticationError(error: unknown): boolean {
  return error instanceof AuthenticationError;
}

type _WindowWithEnv = {
  clearSecureTokens?: () => void;
} & Window;

export function handleAuthenticationError(error: AuthenticationError) {
  try {
    secureLog.security("AUTH", "Authentication error detected", {
      errorCode: error.errorCode,
      message: error.message,
    });
  } catch (err: unknown) {
    log.error(LOG_CATEGORIES.HTTP, "Secure logger call failed", err);
  }

  const win = getWindow() as Window & { clearSecureTokens?: () => void };

  try {
    const session = getSessionStorage();
    const local = getLocalStorage();
    session.removeItem("access_token");
    session.removeItem("refresh_token");
    session.removeItem("id_token");
    session.removeItem("user");
    local.removeItem("access_token");
    local.removeItem("token");
    local.removeItem("user");

    if (win?.clearSecureTokens) win.clearSecureTokens();
  } catch {
    /* ignore */
  }

  try {
    const authErrorEvent = new CustomEvent("authenticationError", {
      detail: { errorCode: error.errorCode, message: error.message },
    });
    setTimeout(() => {
      try {
        if (win) win.dispatchEvent(authErrorEvent);
      } catch (dispatchError) {
        log.warn(
          LOG_CATEGORIES.ERRORS,
          "Authentication error event dispatch failed",
          dispatchError,
        );
      }
    }, 0);
  } catch {
    /* ignore */
  }

  setTimeout(() => {
    if (win) win.location.href = "/login";
  }, 100);
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}
