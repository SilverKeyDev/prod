/**
 * Centralized Error Reporting with PII Scrubbing
 * Implements SOC 2 compliant error reporting and monitoring
 *
 * Barrel file - re-exports from split modules
 */

// Re-export types
export type { ErrorContext, SecurityEvent } from "./errorReporter/types";

// Re-export ErrorReporter class
export { ErrorReporter } from "./errorReporter/ErrorReporterClass";

// Re-export singleton instance and convenience functions
export {
  captureError,
  captureUserFeedback,
  clearUserContext,
  errorReporter,
  initializeErrorReporting,
  reportSecurityEvent,
  setUserContext,
  useErrorReporter,
} from "./errorReporter/instance";

// Re-export helpers
export { ErrorBoundary, reportErrorWithCapture } from "./errorReporter/helpers";
