import { getEnv } from "packages/config/env";
import { log } from "packages/logger";
import type { ClientErrorPayload } from "packages/services/security/reportClientErrors";
import { clientErrorsApi } from "packages/services/security/reportClientErrors";
import { dateNow } from "packages/utils/date";
import { asError } from "packages/utils/errorHandling/error";
import { getNavigator, getWindow } from "packages/utils/platform";

import type { ErrorContext, SecurityEvent } from "./types";

export class ErrorReporter {
  private isInitialized = false;
  private isProduction = false;
  private userId?: string;
  private sessionId?: string;
  private buildVersion?: string;

  constructor() {
    this.isProduction = getEnv().isProduction;
    this.buildVersion = "unknown";
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize error reporting service
   */
  initialize(config?: { userId?: string; dsn?: string }): void {
    if (this.isInitialized) return;

    try {
      this.userId = typeof config?.userId === "string" ? config.userId : undefined;

      if (this.isProduction && typeof config?.dsn === "string") {
        this.initializeSentry(config.dsn);
      }

      this.setupGlobalErrorHandlers();

      this.isInitialized = true;
      if (log && typeof log.info === "function") {
        log.info("ERRORS", "Error reporting initialized", {
          environment: this.isProduction ? "production" : "development",
          buildVersion: typeof this.buildVersion === "string" ? this.buildVersion : "unknown",
          sessionId: typeof this.sessionId === "string" ? this.sessionId : "unknown",
        });
      }
    } catch (error: unknown) {
      if (log && typeof log.error === "function") {
        log.error("ERRORS", "Failed to initialize error reporting", error);
      }
    }
  }

  /**
   * Initialize Sentry (placeholder for actual implementation)
   */
  private initializeSentry(dsn: string): void {
    try {
      if (log && typeof log.info === "function") {
        log.info("ERRORS", "Sentry initialized", {
          dsn: `${dsn.substring(0, 20)}...`,
        });
      }
    } catch (error: unknown) {
      if (log && typeof log.error === "function") {
        log.error("ERRORS", "Failed to initialize Sentry", error);
      }
    }
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    const win = getWindow();
    if (!win) return;

    win.addEventListener("unhandledrejection", (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.captureError(error, {
        type: "unhandled_promise_rejection",
        url: win.location.href,
      });
    });

    win.addEventListener("error", (event) => {
      const error =
        event.error instanceof Error ? event.error : new Error(event.message || "Unknown error");
      this.captureError(error, {
        type: "uncaught_error",
        url: win.location.href,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    win.addEventListener("react-error", (event: unknown) => {
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
      if (!this.isInitialized) {
        this.initialize();
      }

      const errorContext = this.buildErrorContext(context);

      if (log && typeof log.error === "function") {
        log.error("ERRORS", "Error captured", {
          error: this.serializeError(error),
          context: errorContext,
        });
      }

      if (this.isInitialized) {
        this.sendToExternalService(error, errorContext);
      }
    } catch (reportingError: unknown) {
      const error = asError(reportingError);
      log.error("ERRORS", "Error reporting failed", error);
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
        log.security("SECURITY", `${event.type}: ${event.description}`, {
          severity: event.severity,
          metadata: event.metadata,
          context,
        });
      }

      if (this.isProduction && this.isInitialized) {
        this.sendSecurityAlert(event, context);
      }
    } catch (error: unknown) {
      if (log && typeof log.error === "function") {
        log.error("ERRORS", "Failed to report security event", error);
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
        log.info("ERRORS", "User feedback captured", {
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
        log.error("ERRORS", "Failed to capture user feedback", error);
      }
    }
  }

  /**
   * Set user context
   */
  setUserContext(userId: string, userInfo?: Record<string, unknown>): void {
    this.userId = userId;

    if (this.isProduction && this.isInitialized) {
      void userInfo;
    }

    if (log && typeof log.info === "function") {
      log.info("ERRORS", "User context updated", { userId });
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUserContext(): void {
    this.userId = undefined;

    if (log && typeof log.info === "function") {
      log.info("ERRORS", "User context cleared");
    }
  }

  /**
   * Build error context with environment info
   */
  private buildErrorContext(additionalContext?: Record<string, unknown>): ErrorContext {
    const nav = getNavigator();
    const win = getWindow();
    return {
      userId: this.userId,
      userAgent: nav?.userAgent,
      url: win?.location.href,
      timestamp: dateNow().toISOString(),
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
   * Send error to backend for centralized logging
   */
  private sendToExternalService(error: unknown, context: ErrorContext): void {
    try {
      const serialized = this.serializeError(error);
      const errObj =
        serialized && typeof serialized === "object" && "message" in serialized
          ? (serialized as { name?: string; message?: string; stack?: string })
          : { message: String(error) };

      const payload: ClientErrorPayload = {
        message: errObj.message ?? "Unknown error",
        name: errObj.name,
        stack: errObj.stack,
        url: context.url,
        userAgent: context.userAgent,
        timestamp: context.timestamp,
        sessionId: context.sessionId,
        environment: context.environment,
        buildVersion: context.buildVersion,
      };

      if (context.type) payload.type = String(context.type);
      if (context.componentStack) payload.componentStack = String(context.componentStack);
      if (context.errorBoundary === true) payload.errorBoundary = true;
      if (context.routeError === true) payload.routeError = true;
      if (context.filename) payload.filename = String(context.filename);
      if (typeof context.lineno === "number") payload.lineno = context.lineno;
      if (typeof context.colno === "number") payload.colno = context.colno;

      void clientErrorsApi.reportClientError(payload);
    } catch {
      // Fail silently
    }
  }

  /**
   * Send security alert to monitoring
   */
  private sendSecurityAlert(event: SecurityEvent, context: ErrorContext): void {
    try {
      if (log && typeof log.debug === "function") {
        log.debug("ERRORS", "Would send security alert", {
          eventType: event.type,
          severity: event.severity,
        });
      }

      void context;
    } catch {
      // Fail silently
    }
  }

  /**
   * Send user feedback to support system
   */
  private sendUserFeedback(message: string, error: Error | undefined, context: ErrorContext): void {
    try {
      if (log && typeof log.debug === "function") {
        log.debug("ERRORS", "Would send user feedback", {
          hasMessage: !!message,
          hasError: !!error,
        });
      }

      void context;
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
