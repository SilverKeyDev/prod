import { ErrorReporter } from "./ErrorReporterClass";

// Export singleton instance
export const errorReporter = new ErrorReporter();

// Convenience functions
export const captureError = (error: Error | string, context?: Record<string, unknown>) =>
  errorReporter.captureError(error, context);

export const reportSecurityEvent = (event: {
  type:
    | "authentication_failure"
    | "authorization_failure"
    | "suspicious_activity"
    | "data_access"
    | "session_anomaly";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metadata?: Record<string, unknown>;
}) => errorReporter.reportSecurityEvent(event);

export const captureUserFeedback = (message: string, error?: Error) =>
  errorReporter.captureUserFeedback(message, error);

export const setUserContext = (userId: string, userInfo?: Record<string, unknown>) =>
  errorReporter.setUserContext(userId, userInfo);

export const clearUserContext = () => errorReporter.clearUserContext();

// Initialize error reporting
export const initializeErrorReporting = (config?: { userId?: string; dsn?: string }) =>
  errorReporter.initialize(config);

// Hook for React components to report errors
export const useErrorReporter = () => ({
  captureError,
  reportSecurityEvent,
  captureUserFeedback,
});
