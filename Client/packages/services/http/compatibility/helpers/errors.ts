/**
 * Error and auth-error utilities for the compatibility layer
 */

import { log } from "packages/logger";
import { AuthenticationError } from "packages/services/http/client";
import { getWindow } from "packages/utils/core/platform";

export function isAuthenticationError(error: unknown): boolean {
  return error instanceof AuthenticationError;
}

type _WindowWithEnv = {
  clearSecureTokens?: () => void;
} & Window;

export function handleAuthenticationError(error: AuthenticationError) {
  log.security("SECURITY", "Authentication error detected", {
    errorCode: error.errorCode,
    message: error.message,
  });

  const win = getWindow() as Window & { clearSecureTokens?: () => void };

  try {
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
        log.warn("ERRORS", "Authentication error event dispatch failed", dispatchError);
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
