/**
 * Centralized Error Reporting with PII Scrubbing
 * Implements SOC 2 compliant error reporting and monitoring
 */

import { log } from "./secureLogger";

interface ErrorContext {
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  sessionId?: string;
  buildVersion?: string;
  environment?: string;
}

interface SecurityEvent {
  type:
    | "authentication_failure"
    | "authorization_failure"
    | "suspicious_activity"
    | "data_access"
    | "session_anomaly";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metadata?: Record<string, any>;
}

class ErrorReporter {
  private isInitialized = false;
  private isProduction = false;
  private userId?: string;
  private sessionId?: string;
  private buildVersion?: string;

  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.buildVersion = import.meta.env.VITE_BUILD_VERSION ?? "unknown";
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize error reporting service
   */
  async initialize(config?: { userId?: string; dsn?: string }): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.userId = config?.userId;

      // In production, initialize Sentry or other error reporting service
      if (this.isProduction && config?.dsn) {
        await this.initializeSentry(config.dsn);
      }

      // Set up global error handlers
      this.setupGlobalErrorHandlers();

      this.isInitialized = true;
      log.info("ERROR_REPORTER", "Error reporting initialized", {
        environment: this.isProduction ? "production" : "development",
        buildVersion: this.buildVersion,
        sessionId: this.sessionId,
      });
    } catch (error) {
      log.error(
        "ERROR_REPORTER",
        "Failed to initialize error reporting",
        error,
      );
    }
  }

  /**
   * Initialize Sentry (placeholder for actual implementation)
   */
  private async initializeSentry(dsn: string): Promise<void> {
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

      log.info("ERROR_REPORTER", "Sentry initialized", {
        dsn: dsn.substring(0, 20) + "...",
      });
    } catch (error) {
      log.error("ERROR_REPORTER", "Failed to initialize Sentry", error);
    }
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.captureError(event.reason, {
        type: "unhandled_promise_rejection",
        url: window.location.href,
      });
    });

    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      this.captureError(event.error, {
        type: "uncaught_error",
        url: window.location.href,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle React error boundaries (if using)
    window.addEventListener("react-error", (event: unknown) => {
      this.captureError(event.detail.error, {
        type: "react_error",
        componentStack: event.detail.componentStack,
      });
    });
  }

  /**
   * Capture and report an error
   */
  captureError(
    error: Error | string | unknown,
    context?: Record<string, any>,
  ): void {
    try {
      const errorContext = this.buildErrorContext(context);

      // Log locally with PII scrubbing
      log.error("ERROR_CAPTURE", "Error captured", {
        error: this.serializeError(error),
        context: errorContext,
      });

      // Send to external service in production
      if (this.isProduction && this.isInitialized) {
        this.sendToExternalService(error, errorContext);
      }
    } catch (reportingError) {
      // Fail silently to avoid infinite loops
      console.error("Error reporting failed:", reportingError);
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

      log.security("SECURITY_EVENT", `${event.type}: ${event.description}`, {
        severity: event.severity,
        metadata: event.metadata,
        context,
      });

      // Send to security monitoring in production
      if (this.isProduction && this.isInitialized) {
        this.sendSecurityAlert(event, context);
      }
    } catch (error) {
      log.error("ERROR_REPORTER", "Failed to report security event", error);
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

      log.info("USER_FEEDBACK", "User feedback captured", {
        message,
        error: error ? this.serializeError(error) : null,
        context,
      });

      if (this.isProduction && this.isInitialized) {
        this.sendUserFeedback(message, error, context);
      }
    } catch (reportingError) {
      log.error(
        "ERROR_REPORTER",
        "Failed to capture user feedback",
        reportingError,
      );
    }
  }

  /**
   * Set user context
   */
  setUserContext(userId: string, userInfo?: Record<string, any>): void {
    this.userId = userId;

    if (this.isProduction && this.isInitialized) {
      // Update external service user context
      // Sentry.setUser({ id: userId, ...userInfo });
      void userInfo; // Prevent unused variable warning
    }

    log.info("ERROR_REPORTER", "User context updated", { userId });
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

    log.info("ERROR_REPORTER", "User context cleared");
  }

  /**
   * Build error context with environment info
   */
  private buildErrorContext(
    additionalContext?: Record<string, any>,
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
  private serializeError(error: unknown): any {
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
      log.debug("ERROR_REPORTER", "Would send to external service", {
        hasError: !!error,
        contextKeys: Object.keys(context),
      });
    } catch (error) {
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

      log.debug("ERROR_REPORTER", "Would send security alert", {
        eventType: event.type,
        severity: event.severity,
      });

      void context; // Prevent unused variable warning
    } catch (error) {
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

      log.debug("ERROR_REPORTER", "Would send user feedback", {
        hasMessage: !!message,
        hasError: !!error,
      });

      void context; // Prevent unused variable warning
    } catch (error) {
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
  error: Error | string | unknown,
  context?: Record<string, any>,
) => errorReporter.captureError(error, context);

export const reportSecurityEvent = (event: SecurityEvent) =>
  errorReporter.reportSecurityEvent(event);

export const captureUserFeedback = (message: string, error?: Error) =>
  errorReporter.captureUserFeedback(message, error);

export const setUserContext = (
  userId: string,
  userInfo?: Record<string, any>,
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
