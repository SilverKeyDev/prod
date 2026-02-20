/**
 * Error and auth-error utilities for the compatibility layer
 */

import { log, LOG_CATEGORIES } from "logger";

import { AuthenticationError, HttpError } from "packages/services/http/client";
import { getWindow } from "packages/utils/core/platform";
import {
  getLocalStorage,
  getSessionStorage,
} from "packages/utils/core/storage/platformStorage";

export function logHttp(scope: string, e: unknown) {
  import("../../../security/secureLogger")
    .then(({ log }) => {
      if (e instanceof AuthenticationError) {
        log.security(scope, `Authentication error: ${e.errorCode}`, {
          message: e.message,
        });
      } else if (e instanceof HttpError) {
        log.warn(scope, `HTTP ${e.status} error`, {
          status: e.status,
          url: e.url,
          body: e.bodyPreview,
        });
      } else if (e instanceof Error && e.name === "AbortError") {
        log.debug(scope, "Request aborted");
      } else {
        log.error(scope, "Unexpected HTTP error", e);
      }
    })
    .catch((err: unknown) =>
      log.error(LOG_CATEGORIES.HTTP, "Secure logger import or log failed", err),
    );
}

export function isAuthenticationError(error: unknown): boolean {
  return error instanceof AuthenticationError;
}

type _WindowWithEnv = {
  clearSecureTokens?: () => void;
} & Window;

export function handleAuthenticationError(error: AuthenticationError) {
  import("../../../security/secureLogger")
    .then(({ log }) => {
      log.security("AUTH", "Authentication error detected", {
        errorCode: error.errorCode,
        message: error.message,
      });
    })
    .catch((err: unknown) =>
      log.error(LOG_CATEGORIES.HTTP, "Secure logger import or log failed", err),
    );

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
