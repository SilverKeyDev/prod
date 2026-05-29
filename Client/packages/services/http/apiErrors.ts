import { log, LOG_CATEGORIES } from "packages/logger";
import { log as secureLog } from "packages/services/security/secureLogger";

import { notifyAuthenticationError } from "./client/authErrorNotify";
import { AuthenticationError, HttpError } from "./client/errors";

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

export function handleAuthenticationError(error: AuthenticationError): void {
  notifyAuthenticationError(error);
}
