import { log } from "packages/logger";
import type { AuthenticationError } from "packages/services/http/client/errors";
import { getWindow } from "packages/utils/core/platform";

import { broadcastAuthLogout } from "./authBroadcast";
import { redirectToLoginIfNeeded } from "./authRedirect";

/** HTTP-layer auth failure handling without importing the auth store (avoids import cycles). */
export function notifyAuthenticationError(error: AuthenticationError): void {
  log.security("AUTH", "Authentication error detected", {
    errorCode: error.errorCode,
    message: error.message,
  });

  const win = getWindow();
  try {
    const authErrorEvent = new CustomEvent("authenticationError", {
      detail: { errorCode: error.errorCode, message: error.message },
    });
    setTimeout(() => {
      try {
        if (win) win.dispatchEvent(authErrorEvent);
      } catch (dispatchError) {
        log.warn("HTTP", "Authentication error event dispatch failed", dispatchError);
      }
    }, 0);
  } catch {
    /* ignore */
  }

  broadcastAuthLogout();
  redirectToLoginIfNeeded();
}
