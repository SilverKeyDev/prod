/**
 * Shared error boundary reporting: logs errors from React Error Boundaries.
 * Used by ErrorProvider (web and native) so behavior is consistent.
 * Framework-agnostic; accepts React ErrorInfo-shaped metadata.
 *
 * Note: External error reporting (Sentry, etc.) is handled by global error handlers
 * in packages/services/security/errorReporting.ts via the "react-error" event.
 */

import { log } from "packages/logger";
import { dateNow } from "packages/utils/core/date";
import { getWindow } from "packages/utils/core/platform";

export type ErrorBoundaryInfo = {
  componentStack?: string;
};

/**
 * Log an error from an error boundary (e.g. React ErrorBoundary).
 * Also dispatches a React error event for external error reporting.
 * Catches and logs any failure to avoid secondary errors.
 */
export function reportErrorBoundary(error: Error, errorInfo: ErrorBoundaryInfo): void {
  try {
    // Log the error with centralized logging
    log.error("ERRORS", "React Error Boundary caught error", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: dateNow().toISOString(),
    });

    // Dispatch React error event for external error reporting
    // This will be caught by the global error handlers in errorReporting.ts
    const win = getWindow();
    if (win && typeof win.dispatchEvent === "function") {
      try {
        const reactErrorEvent = new CustomEvent("react-error", {
          detail: {
            error,
            componentStack: errorInfo.componentStack,
          },
        });
        win.dispatchEvent(reactErrorEvent);
      } catch (eventError) {
        // Fail silently if event dispatch fails
        log.debug("ERRORS", "Failed to dispatch react-error event", {
          error: eventError instanceof Error ? eventError.message : String(eventError),
        });
      }
    }
  } catch (reportingError) {
    log.error("ERRORS", "Error boundary reporting failed", {
      error: reportingError instanceof Error ? reportingError.message : String(reportingError),
    });
  }
}
