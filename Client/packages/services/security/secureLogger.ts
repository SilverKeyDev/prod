/**
 * Secure Logger with PII Scrubbing
 * Implements SOC 2 compliant logging that removes sensitive data
 */

import { asError } from "../../utils/error.js";

import {
  scrubPII,
  maskSensitiveData,
  createSafeLogObject,
} from "./piiSecurity.js";

type LogLevel = {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
};

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class SecureLogger {
  private currentLevel: number;
  private isProduction: boolean;
  private isProcessing: boolean = false;
  private originalConsole: unknown;

  constructor() {
    this.isProduction = isProduction;
    this.currentLevel = this.isProduction ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
    // Store original console methods before they get overridden
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };
  }

  /**
   * Scrub PII from any value using centralized PII security service
   */
  private scrubPII(value: unknown): unknown {
    // Prevent infinite recursion during error logging
    if (this.isProcessing) {
      return "[PROCESSING]";
    }

    try {
      this.isProcessing = true;
      return scrubPII(value);
    } catch {
      // Fallback to prevent infinite loops
      return "[SCRUB_ERROR]";
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Scrub PII patterns from strings using centralized service
   */
  private scrubStringPII(str: string): string {
    // Prevent infinite recursion
    if (this.isProcessing) {
      return "[PROCESSING]";
    }

    try {
      this.isProcessing = true;
      return maskSensitiveData(str);
    } catch {
      // Fallback to prevent infinite loops
      return "[SCRUB_ERROR]";
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(
    level: string,
    scope: string,
    message: string,
    data?: unknown,
  ): string {
    // Prevent infinite recursion during error logging
    if (this.isProcessing) {
      const timestamp = new Date().toISOString();
      return `[${timestamp}] [${level}] [${scope}] ${message} [RECURSION_PREVENTED]`;
    }

    try {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level}] [${scope}]`;

      if (data) {
        const scrubbedData = this.scrubPII(data);
        return `${prefix} ${message} ${JSON.stringify(scrubbedData)}`;
      }

      return `${prefix} ${this.scrubStringPII(message)}`;
    } catch {
      // Fallback formatting to prevent crashes
      const timestamp = new Date().toISOString();
      return `[${timestamp}] [${level}] [${scope}] ${message} [FORMAT_ERROR]`;
    }
  }

  /**
   * Debug logging (development only)
   */
  debug(scope: string, message: string, data?: unknown): void {
    if (this.currentLevel <= LOG_LEVELS.DEBUG) {
      try {
        const formatted = this.formatMessage("DEBUG", scope, message, data);
        (this.originalConsole as { debug: (msg: string) => void }).debug(
          formatted,
        );
      } catch (err: unknown) {
        const error = asError(err);
        (
          this.originalConsole as { error: (msg: string, err: unknown) => void }
        ).error("SecureLogger debug error:", error);
      }
    }
  }

  /**
   * Info logging
   */
  info(scope: string, message: string, data?: unknown): void {
    if (this.currentLevel <= LOG_LEVELS.INFO) {
      try {
        const formatted = this.formatMessage("INFO", scope, message, data);
        (this.originalConsole as { info: (msg: string) => void }).info(
          formatted,
        );
      } catch (err: unknown) {
        const error = asError(err);
        (
          this.originalConsole as { error: (msg: string, err: unknown) => void }
        ).error("SecureLogger info error:", error);
      }
    }
  }

  /**
   * Warning logging
   */
  warn(scope: string, message: string, data?: unknown): void {
    if (this.currentLevel <= LOG_LEVELS.WARN) {
      try {
        const formatted = this.formatMessage("WARN", scope, message, data);
        (this.originalConsole as { warn: (msg: string) => void }).warn(
          formatted,
        );
      } catch (err: unknown) {
        const error = asError(err);
        (
          this.originalConsole as { error: (msg: string, err: unknown) => void }
        ).error("SecureLogger warn error:", error);
      }
    }
  }

  /**
   * Error logging
   */
  error(scope: string, message: string, error?: unknown): void {
    if (this.currentLevel <= LOG_LEVELS.ERROR) {
      try {
        let errorData = error;

        // Handle Error objects
        if (error instanceof Error) {
          errorData = {
            name: error.name,
            message: error.message,
            stack: this.isProduction ? "[REDACTED]" : error.stack,
          };
        }

        const formatted = this.formatMessage(
          "ERROR",
          scope,
          message,
          errorData,
        );
        (this.originalConsole as { error: (msg: string) => void }).error(
          formatted,
        );
      } catch (err: unknown) {
        const error = asError(err);
        (
          this.originalConsole as { error: (msg: string, err: unknown) => void }
        ).error("SecureLogger error error:", error);
      }
    }
  }

  /**
   * Security event logging (always logs)
   */
  security(scope: string, event: string, data?: unknown): void {
    try {
      const scrubbedData = data ? createSafeLogObject(data) : undefined;
      const formatted = this.formatMessage(
        "SECURITY",
        scope,
        `🔒 ${event}`,
        scrubbedData,
      );
      (this.originalConsole as { warn: (msg: string) => void }).warn(formatted);

      // In production, could send to security monitoring service
      if (this.isProduction) {
        this.sendToSecurityMonitoring(scope, event, scrubbedData);
      }
    } catch (err: unknown) {
      const error = asError(err);
      (
        this.originalConsole as { error: (msg: string, err: unknown) => void }
      ).error("SecureLogger security error:", error);
    }
  }

  /**
   * Send security events to monitoring service (placeholder)
   */
  private sendToSecurityMonitoring(
    scope: string,
    event: string,
    data?: unknown,
  ): void {
    // Placeholder for integration with security monitoring service
    // e.g., Datadog, Splunk, etc.
    try {
      // Example: Send to monitoring endpoint
      // fetch('/api/security-events', {
      //   method: 'POST',
      //   body: JSON.stringify({ scope, event, data, timestamp: new Date().toISOString() })
      // });

      // Prevent unused variable warnings
      void scope;
      void event;
      void data;
    } catch {
      // Fail silently to avoid logging loops
    }
  }

  /**
   * Set log level dynamically
   */
  setLevel(level: keyof LogLevel): void {
    this.currentLevel = LOG_LEVELS[level];
  }

  /**
   * Check if level is enabled
   */
  isLevelEnabled(level: keyof LogLevel): boolean {
    return this.currentLevel <= LOG_LEVELS[level];
  }
}

// Export singleton instance
// Note: isProduction is determined directly to avoid circular dependency with config
const isProduction = import.meta.env.MODE === "production";
export const secureLogger = new SecureLogger();

// Convenience exports
export const log = {
  debug: (scope: string, message: string, data?: unknown) =>
    secureLogger.debug(scope, message, data),
  info: (scope: string, message: string, data?: unknown) =>
    secureLogger.info(scope, message, data),
  warn: (scope: string, message: string, data?: unknown) =>
    secureLogger.warn(scope, message, data),
  error: (scope: string, message: string, error?: unknown) =>
    secureLogger.error(scope, message, error),
  security: (scope: string, event: string, data?: unknown) =>
    secureLogger.security(scope, event, data),
};

// Replace console methods in production
if (isProduction) {
  const originalConsole = { ...console };

  // Use original console methods in the logger to prevent recursion
  const safeConsole = {
    log: originalConsole.log.bind(originalConsole),
    info: originalConsole.info.bind(originalConsole),
    warn: originalConsole.warn.bind(originalConsole),
    error: originalConsole.error.bind(originalConsole),
    debug: originalConsole.debug.bind(originalConsole),
  };

  // COMMENTED OUT: Console method overrides disabled to allow console.log in production
  /*
  console.log = (...args) => {
    try {
      secureLogger.info('CONSOLE', args.join(' '));
    } catch (err: unknown) {
      const error = asError(err);
      safeConsole.error('SecureLogger error:', error);
    }
  };

  console.info = (...args) => {
    try {
      secureLogger.info('CONSOLE', args.join(' '));
    } catch (err: unknown) {
      const error = asError(err);
      safeConsole.error('SecureLogger error:', error);
    }
  };

  console.warn = (...args) => {
    try {
      secureLogger.warn('CONSOLE', args.join(' '));
    } catch (err: unknown) {
      const error = asError(err);
      safeConsole.error('SecureLogger error:', error);
    }
  };

  console.error = (...args) => {
    try {
      secureLogger.error('CONSOLE', args.join(' '));
    } catch (err: unknown) {
      const error = asError(err);
      safeConsole.error('SecureLogger error:', error);
    }
  };

  console.debug = (...args) => {
    try {
      secureLogger.debug('CONSOLE', args.join(' '));
    } catch (err: unknown) {
      const error = asError(err);
      safeConsole.error('SecureLogger error:', error);
    }
  };
  */

  // Keep original methods available for emergency debugging
  (
    window as unknown as { __originalConsole: typeof originalConsole }
  ).__originalConsole = originalConsole;
  (window as unknown as { __safeConsole: typeof safeConsole }).__safeConsole =
    safeConsole;
}
