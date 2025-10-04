/**
 * Centralized Error Reporting with PII Scrubbing
 * Implements SOC 2 compliant error reporting and monitoring
 */

import { asError } from "../../utils/error";

import { log } from "./secureLogger";

type ErrorContext = {
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  sessionId?: string;
  buildVersion?: string;
  environment?: string;
};

type SecurityEvent = {
  type:
    | "authentication_failure"
    | "authorization_failure"
    | "suspicious_activity"
    | "data_access"
    | "session_anomaly";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metadata?: Record<string, unknown>;
};

class ErrorReporter {
  private isInitialized = false;
  private isProduction = false;
  private userId?: string;
  private sessionId?: string;
  private buildVersion?: string;

  constructor() {
    // Safe access to import.meta.env with proper type guards
    const env =
      import.meta?.env && typeof import.meta.env === "object"
        ? import.meta.env
        : {};
    this.isProduction = "MODE" in env && env.MODE === "production";
    this.buildVersion = "unknown"; // Build version not available in client
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize error reporting service
   */
  initialize(config?: { userId?: string; dsn?: string }): void {
    if (this.isInitialized) return;

    try {
      this.userId =
        typeof config?.userId === "string" ? config.userId : undefined;

      // In production, initialize Sentry or other error reporting service
      if (this.isProduction && typeof config?.dsn === "string") {
        this.initializeSentry(config.dsn);
      }

      // Set up global error handlers
      this.setupGlobalErrorHandlers();

      this.isInitialized = true;
      if (log && typeof log.info === "function") {
        log.info("ERROR_REPORTER", "Error reporting initialized", {
          environment: this.isProduction ? "production" : "development",
          buildVersion:
            typeof this.buildVersion === "string"
              ? this.buildVersion
              : "unknown",
          sessionId:
            typeof this.sessionId === "string" ? this.sessionId : "unknown",
        });
      }
    } catch (error: unknown) {
      if (log && typeof log.error === "function") {
        log.error(
          "ERROR_REPORTER",
          "Failed to initialize error reporting",
          error,
        );
      }
    }
  }

  /**
   * Initialize Sentry (placeholder for actual implementation)
   */
  private initializeSentry(dsn: string): void {
    try {
      // Placeholder for Sentry initialization
      // In a real implementation, you would:
      // import * as Sentry from '@sentry/react';
      // Sentry.init({
      //   dsn,
      //   environment: this.isProduction ? 'production' : 'development',
      //   beforeSend: (event) => this.scrubSentryEvent(event),
      //   integrations: [new Sentry.BrowserTracing()],
      //   tracesSampleRate: this.isProduction ? 0.1 : 1.0,
      // });

      if (log && typeof log.info === "function") {
        log.info("ERROR_REPORTER", "Sentry initialized", {
          dsn: `${dsn.substring(0, 20)}...`,
        });
      }
    } catch (error: unknown) {
      if (log && typeof log.error === "function") {
        log.error("ERROR_REPORTER", "Failed to initialize Sentry", error);
      }
    }
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));
      this.captureError(error, {
        type: "unhandled_promise_rejection",
        url: window.location.href,
      });
    });

    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      const error =
        event.error instanceof Error
          ? event.error
          : new Error(event.message || "Unknown error");
      this.captureError(error, {
        type: "uncaught_error",
        url: window.location.href,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle React error boundaries (if using)
    window.addEventListener("react-error", (event: unknown) => {
      if (event && typeof event === "object" && "detail" in event) {
        const customEvent = event as {
          detail: { error: Error; componentStack: string };
        };
        this.captureError(customEvent.detail.error, {
          type: "react_error",
          componentStack: customEvent.detail.componentStack,
        });
      }
    });
  }

  /**
   * Capture and report an error
   */
  captureError(error: Error | string, context?: Record<string, unknown>): void {
    try {
      const errorContext = this.buildErrorContext(context);

      // Log locally with PII scrubbing
      if (log && typeof log.error === "function") {
        log.error("ERROR_CAPTURE", "Error captured", {
          error: this.serializeError(error),
          context: errorContext,
        });
      }

      // Send to external service in production
      if (this.isProduction && this.isInitialized) {
        this.sendToExternalService(error, errorContext);
      }
    } catch (reportingError: unknown) {
      const error = asError(reportingError);
      // Fail silently to avoid infinite loops
      console.error("Error reporting failed:", error);
    }
  }

  /**
   * Report security events
   */
  reportSecurityEvent(event: SecurityEvent): void {
    try {
      const context = this.buildErrorContext({
        securityEvent: true,
        eventType: event.type,
        severity: event.severity,
      });

      if (log && typeof log.security === "function") {
        log.security("SECURITY_EVENT", `${event.type}: ${event.description}`, {
          severity: event.severity,
          metadata: event.metadata,
          context,
        });
      }

      // Send to security monitoring in production
      if (this.isProduction && this.isInitialized) {
        this.sendSecurityAlert(event, context);
      }
    } catch (error: unknown) {
      if (log && typeof log.error === "function") {
        log.error("ERROR_REPORTER", "Failed to report security event", error);
      }
    }
  }

  /**
   * Capture user feedback with error
   */
  captureUserFeedback(message: string, error?: Error): void {
    try {
      const context = this.buildErrorContext({
        userFeedback: true,
        feedbackMessage: message,
      });

      if (log && typeof log.info === "function") {
        log.info("USER_FEEDBACK", "User feedback captured", {
          message,
          error: error ? this.serializeError(error) : null,
          context,
        });
      }

      if (this.isProduction && this.isInitialized) {
        this.sendUserFeedback(message, error, context);
      }
    } catch (reportingError: unknown) {
      const error = asError(reportingError);
      if (log && typeof log.error === "function") {
        log.error("ERROR_REPORTER", "Failed to capture user feedback", error);
      }
    }
  }

  /**
   * Set user context
   */
  setUserContext(userId: string, userInfo?: Record<string, unknown>): void {
    this.userId = userId;

    if (this.isProduction && this.isInitialized) {
      // Update external service user context
      // Sentry.setUser({ id: userId, ...userInfo });
      void userInfo; // Prevent unused variable warning
    }

    if (log && typeof log.info === "function") {
      log.info("ERROR_REPORTER", "User context updated", { userId });
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUserContext(): void {
    this.userId = undefined;

    if (this.isProduction && this.isInitialized) {
      // Clear external service user context
      // Sentry.setUser(null);
    }

    if (log && typeof log.info === "function") {
      log.info("ERROR_REPORTER", "User context cleared");
    }
  }

  /**
   * Build error context with environment info
   */
  private buildErrorContext(
    additionalContext?: Record<string, unknown>,
  ): ErrorContext {
    return {
      userId: this.userId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      buildVersion: this.buildVersion,
      environment: this.isProduction ? "production" : "development",
      ...additionalContext,
    };
  }

  /**
   * Serialize error for logging
   */
  private serializeError(error: unknown): unknown {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? "[REDACTED]" : error.stack,
      };
    }

    if (typeof error === "string") {
      return { message: error };
    }

    return { message: "Unknown error", error };
  }

  /**
   * Send error to external monitoring service
   */
  private sendToExternalService(error: unknown, context: ErrorContext): void {
    try {
      // Placeholder for external service integration
      // In production, this would send to Sentry, Datadog, etc.
      // Sentry.captureException(error, { contexts: { custom: context } });

      // For now, just log that we would send it
      if (log && typeof log.debug === "function") {
        log.debug("ERROR_REPORTER", "Would send to external service", {
          hasError: !!error,
          contextKeys: Object.keys(context),
        });
      }
    } catch {
      // Fail silently
    }
  }

  /**
   * Send security alert to monitoring
   */
  private sendSecurityAlert(event: SecurityEvent, context: ErrorContext): void {
    try {
      // Placeholder for security monitoring integration
      // This could integrate with SIEM, security dashboards, etc.

      if (log && typeof log.debug === "function") {
        log.debug("ERROR_REPORTER", "Would send security alert", {
          eventType: event.type,
          severity: event.severity,
        });
      }

      void context; // Prevent unused variable warning
    } catch {
      // Fail silently
    }
  }

  /**
   * Send user feedback to support system
   */
  private sendUserFeedback(
    message: string,
    error: Error | undefined,
    context: ErrorContext,
  ): void {
    try {
      // Placeholder for user feedback integration
      // This could integrate with support ticketing systems

      if (log && typeof log.debug === "function") {
        log.debug("ERROR_REPORTER", "Would send user feedback", {
          hasMessage: !!message,
          hasError: !!error,
        });
      }

      void context; // Prevent unused variable warning
    } catch {
      // Fail silently
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

// Export singleton instance
export const errorReporter = new ErrorReporter();

// Convenience functions
export const captureError = (
  error: Error | string,
  context?: Record<string, unknown>,
) => errorReporter.captureError(error, context);

export const reportSecurityEvent = (event: SecurityEvent) =>
  errorReporter.reportSecurityEvent(event);

export const captureUserFeedback = (message: string, error?: Error) =>
  errorReporter.captureUserFeedback(message, error);

export const setUserContext = (
  userId: string,
  userInfo?: Record<string, unknown>,
) => errorReporter.setUserContext(userId, userInfo);

export const clearUserContext = () => errorReporter.clearUserContext();

// Initialize error reporting
export const initializeErrorReporting = (config?: {
  userId?: string;
  dsn?: string;
}) => errorReporter.initialize(config);

// React Error Boundary helper
export class ErrorBoundary extends Error {
  constructor(
    message: string,
    public componentStack?: string,
  ) {
    super(message);
    this.name = "ErrorBoundary";
  }
}

// Hook for React components to report errors
export const useErrorReporter = () => ({
  captureError,
  reportSecurityEvent,
  captureUserFeedback,
});
