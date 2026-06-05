/**
 * Centralized Error Handling Utilities
 * Consolidates error context building and serialization from reports.ts and errorReporting.ts
 */

import { dateNow } from "packages/utils/core/date";
import { getNavigator, getWindow } from "packages/utils/core/platform";
import { getSessionStorage } from "packages/utils/core/storage/platformStorage";

import { redactErrorMessage, scrubPII } from "./piiSecurity";

export type ErrorContext = {
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  additionalData?: Record<string, unknown>;
};

export type SerializedError = {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
  code?: string | number;
  status?: number;
};

/**
 * Create standardized error context for logging and reporting
 */
export function createErrorContext(options: {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, unknown>;
}): ErrorContext {
  const nav = getNavigator();
  const win = getWindow();
  return {
    timestamp: dateNow().toISOString(),
    userAgent: nav?.userAgent ?? "",
    url: win?.location.href ?? "",
    userId: options.userId,
    sessionId: getSessionId(),
    component: options.component,
    action: options.action,
    additionalData: (() => {
      if (!options.additionalData) return undefined;
      const scrubbed = scrubPII(options.additionalData);
      return scrubbed && typeof scrubbed === "object" && !Array.isArray(scrubbed)
        ? (scrubbed as Record<string, unknown>)
        : undefined;
    })(),
  };
}

/**
 * Serialize error object with PII scrubbing
 */
export function serializeError(error: unknown): SerializedError {
  if (!error) {
    return {
      name: "UnknownError",
      message: "No error information available",
    };
  }

  const errorObj = error as Record<string, unknown>;
  const serialized: SerializedError = {
    name:
      (typeof errorObj.name === "string" ? errorObj.name : errorObj.constructor?.name) ?? "Error",
    message: redactErrorMessage(
      typeof errorObj.message === "string"
        ? errorObj.message
        : errorObj.message != null
          ? (() => {
              try {
                if (typeof errorObj.message === "object" && errorObj.message !== null) {
                  // Try to extract meaningful information from the object
                  const messageObj = errorObj.message as Record<string, unknown>;
                  if (typeof messageObj.message === "string") {
                    return messageObj.message;
                  }
                  if (typeof messageObj.error === "string") {
                    return messageObj.error;
                  }
                  if (typeof messageObj.detail === "string") {
                    return messageObj.detail;
                  }
                  return "[Object]";
                }
                if (typeof errorObj.message === "string") {
                  return errorObj.message;
                }
                if (typeof errorObj.message === "number" || typeof errorObj.message === "boolean") {
                  return String(errorObj.message);
                }
                return "[Unknown]";
              } catch {
                return "[Unknown]";
              }
            })()
          : "Unknown error"
    ),
  };

  if (typeof errorObj.stack === "string") {
    serialized.stack = redactErrorMessage(errorObj.stack);
  }

  if (errorObj.cause) {
    serialized.cause = scrubPII(errorObj.cause);
  }

  if (typeof errorObj.code === "string" || typeof errorObj.code === "number") {
    serialized.code = errorObj.code;
  }

  if (typeof errorObj.status === "number") {
    serialized.status = errorObj.status;
  }

  return serialized;
}

/**
 * Create comprehensive error report with context
 */
export function createErrorReport(
  error: unknown,
  context: Partial<ErrorContext> = {}
): {
  error: SerializedError;
  context: ErrorContext;
} {
  return {
    error: serializeError(error),
    context: createErrorContext(context),
  };
}

/**
 * Extract meaningful error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) return "Unknown error occurred";

  if (typeof error === "string") return redactErrorMessage(error);

  const errorObj = error as Record<string, unknown>;
  if (typeof errorObj.message === "string") {
    return redactErrorMessage(errorObj.message);
  }

  if (errorObj.error && typeof errorObj.error === "object") {
    const nestedError = errorObj.error as Record<string, unknown>;
    if (typeof nestedError.message === "string") {
      return redactErrorMessage(nestedError.message);
    }
  }

  if (typeof errorObj.statusText === "string") return redactErrorMessage(errorObj.statusText);

  return redactErrorMessage(
    typeof errorObj.message === "string"
      ? errorObj.message
      : errorObj.message != null
        ? (() => {
            try {
              if (typeof errorObj.message === "object" && errorObj.message !== null) {
                // Try to extract meaningful information from the object
                const messageObj = errorObj.message as Record<string, unknown>;
                if (typeof messageObj.message === "string") {
                  return messageObj.message;
                }
                if (typeof messageObj.error === "string") {
                  return messageObj.error;
                }
                if (typeof messageObj.detail === "string") {
                  return messageObj.detail;
                }
                return "[Object]";
              }
              if (typeof errorObj.message === "string") {
                return errorObj.message;
              }
              if (typeof errorObj.message === "number" || typeof errorObj.message === "boolean") {
                return String(errorObj.message);
              }
              return "[Unknown]";
            } catch {
              return "[Unknown]";
            }
          })()
        : "Unknown error"
  );
}

/**
 * Check if error is a network/connectivity error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  const message = extractErrorMessage(error).toLowerCase();
  const networkIndicators = [
    "network",
    "fetch",
    "connection",
    "timeout",
    "offline",
    "cors",
    "net::",
  ];

  return networkIndicators.some((indicator) => message.includes(indicator));
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;

  const errorObj = error as Record<string, unknown>;
  const status =
    errorObj.status ??
    (errorObj.response && typeof errorObj.response === "object"
      ? (errorObj.response as Record<string, unknown>).status
      : undefined);
  if (status === 401 || status === 403) return true;

  const message = extractErrorMessage(error).toLowerCase();
  const authIndicators = ["unauthorized", "forbidden", "authentication", "token", "login"];

  return authIndicators.some((indicator) => message.includes(indicator));
}

/**
 * Get or create session ID for error tracking
 */
function getSessionId(): string {
  const session = getSessionStorage();
  let sessionId = session.getItem("sessionId");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    session.setItem("sessionId", sessionId);
  }
  return sessionId;
}
