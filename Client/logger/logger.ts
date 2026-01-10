/**
 * Centralized Logger with Category-Based Filtering
 * Supports runtime config reloading and PII scrubbing
 *
 * Adding New Log Categories:
 * 1. Add the category to logger.config.json (e.g., "search": true)
 *    - Categories can be added to config JSON even before code exists
 *    - The logger will handle unknown categories gracefully
 * 2. When implementing logging code:
 *    - Add to categories.ts: LogCategory type and LOG_CATEGORIES object
 *    - Add mapping in categoryToConfigKey function (categories.ts)
 *    - Add to LoggerConfig interface in logger.ts (optional, for type safety)
 * 3. Use the category in code: log.info(LOG_CATEGORIES.SEARCH, "message", data)
 *
 * The logger supports both defined categories (from categories.ts) and future
 * categories (from config JSON) - unknown categories are converted to camelCase
 * and checked against the config.
 */

import type { LogCategory } from "./categories";
import {
  LOG_CATEGORIES,
  categoryToConfigKey,
  isAlwaysEnabled,
} from "./categories";
import {
  scrubPII,
  maskSensitiveData,
  createSafeLogObject,
} from "./pii";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LoggerConfig {
  polling: boolean;
  initialApiCalls: boolean;
  pages: boolean;
  hooks: boolean;
  auth: boolean;
  http: boolean;
  api: boolean;
  errors: boolean;
  security: boolean;
  search?: boolean;
  negotiation?: boolean;
  checklists?: boolean;
  calendar?: boolean;
  dashboard?: boolean;
  messages?: boolean;
  logLevel: LogLevel;
  // Allow additional category flags for future categories
  [key: string]: boolean | LogLevel | undefined;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  private config: LoggerConfig;
  private isProcessing: boolean = false;
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };

    // Load initial config
    this.config = this.loadConfig();
  }

  /**
   * Load config from JSON file
   * In browser environment, this will need to be loaded via fetch
   * For now, we'll use a default config and allow runtime updates
   */
  private loadConfig(): LoggerConfig {
    // Default config
    const defaultConfig: LoggerConfig = {
      polling: true,
      initialApiCalls: true,
      pages: true,
      hooks: true,
      auth: true,
      http: true,
      api: true,
      errors: true,
      security: true,
      logLevel: "DEBUG",
    };

    // Try to load from config file (async, but we'll handle it)
    // For runtime reloading, we'll provide a method to update config
    return defaultConfig;
  }

  /**
   * Reload config from file (async)
   */
  async reloadConfig(): Promise<void> {
    try {
      const response = await fetch("/logger/logger.config.json");
      if (response.ok) {
        const config = await response.json();
        this.config = { ...this.config, ...config };
      }
    } catch (error) {
      // If config file doesn't exist or can't be loaded, use defaults
      this.originalConsole.warn(
        "[Logger] Failed to reload config, using current config",
        error,
      );
    }
  }

  /**
   * Update config programmatically (for runtime toggling)
   */
  updateConfig(updates: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current config (read-only)
   */
  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }

  /**
   * Check if a category is enabled
   * Handles both defined categories (from categories.ts) and future categories (from config JSON)
   */
  private isCategoryEnabled(category: LogCategory | string): boolean {
    // Check if it's a known category that's always enabled
    if (typeof category === "string" && category in LOG_CATEGORIES) {
      const logCategory = category as LogCategory;
      if (isAlwaysEnabled(logCategory)) {
        return true;
      }
    }

    // Try to get config key from category mapping (for defined categories)
    let configKey: string;
    try {
      if (typeof category === "string" && category in LOG_CATEGORIES) {
        configKey = categoryToConfigKey(category as LogCategory);
      } else {
        // For future categories not yet in categories.ts, convert to camelCase
        // e.g., "SEARCH" -> "search", "INITIAL_API_CALLS" -> "initialApiCalls"
        configKey = category
          .toLowerCase()
          .split("_")
          .map((word, index) =>
            index === 0
              ? word
              : word.charAt(0).toUpperCase() + word.slice(1),
          )
          .join("");
      }
    } catch {
      // If categoryToConfigKey fails, try direct camelCase conversion
      configKey = category
        .toLowerCase()
        .split("_")
        .map((word, index) =>
          index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join("");
    }

    // Check config - default to false if not found
    const configValue = this.config[configKey as keyof LoggerConfig];
    return configValue === true;
  }

  /**
   * Check if log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    const currentLevel = LOG_LEVELS[this.config.logLevel];
    const messageLevel = LOG_LEVELS[level];
    return messageLevel >= currentLevel;
  }

  /**
   * Format log message with timestamp and category
   */
  private formatMessage(
    level: LogLevel,
    category: LogCategory | string,
    message: string,
    data?: unknown,
  ): string {
    if (this.isProcessing) {
      const timestamp = new Date().toISOString();
      return `[${timestamp}] [${level}] [${category}] ${message} [RECURSION_PREVENTED]`;
    }

    try {
      this.isProcessing = true;
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level}] [${category}]`;

      if (data) {
        const scrubbedData = createSafeLogObject(data);
        return `${prefix} ${maskSensitiveData(message)} ${JSON.stringify(scrubbedData)}`;
      }

      return `${prefix} ${maskSensitiveData(message)}`;
    } catch {
      const timestamp = new Date().toISOString();
      return `[${timestamp}] [${level}] [${category}] ${message} [FORMAT_ERROR]`;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Debug logging
   */
  debug(category: LogCategory, message: string, data?: unknown): void {
    if (!this.isCategoryEnabled(category) || !this.isLevelEnabled("DEBUG")) {
      return;
    }

    try {
      const formatted = this.formatMessage("DEBUG", category, message, data);
      this.originalConsole.debug(formatted);
    } catch (error) {
      this.originalConsole.error("[Logger] Debug error:", error);
    }
  }

  /**
   * Info logging
   */
  info(category: LogCategory, message: string, data?: unknown): void {
    if (!this.isCategoryEnabled(category) || !this.isLevelEnabled("INFO")) {
      return;
    }

    try {
      const formatted = this.formatMessage("INFO", category, message, data);
      this.originalConsole.info(formatted);
    } catch (error) {
      this.originalConsole.error("[Logger] Info error:", error);
    }
  }

  /**
   * Warning logging
   */
  warn(category: LogCategory, message: string, data?: unknown): void {
    if (!this.isCategoryEnabled(category) || !this.isLevelEnabled("WARN")) {
      return;
    }

    try {
      const formatted = this.formatMessage("WARN", category, message, data);
      this.originalConsole.warn(formatted);
    } catch (error) {
      this.originalConsole.error("[Logger] Warn error:", error);
    }
  }

  /**
   * Error logging
   */
  error(category: LogCategory, message: string, error?: unknown): void {
    if (!this.isCategoryEnabled(category) || !this.isLevelEnabled("ERROR")) {
      return;
    }

    try {
      let errorData = error;

      // Handle Error objects
      if (error instanceof Error) {
        errorData = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      }

      const formatted = this.formatMessage(
        "ERROR",
        category,
        message,
        errorData,
      );
      this.originalConsole.error(formatted);
    } catch (err) {
      this.originalConsole.error("[Logger] Error logging error:", err);
    }
  }

  /**
   * Security event logging (always logs)
   */
  security(category: LogCategory, event: string, data?: unknown): void {
    try {
      const scrubbedData = data ? createSafeLogObject(data) : undefined;
      const formatted = this.formatMessage(
        "WARN",
        category,
        `🔒 ${event}`,
        scrubbedData,
      );
      this.originalConsole.warn(formatted);
    } catch (error) {
      this.originalConsole.error("[Logger] Security logging error:", error);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const log = {
  debug: (category: LogCategory, message: string, data?: unknown) =>
    logger.debug(category, message, data),
  info: (category: LogCategory, message: string, data?: unknown) =>
    logger.info(category, message, data),
  warn: (category: LogCategory, message: string, data?: unknown) =>
    logger.warn(category, message, data),
  error: (category: LogCategory, message: string, error?: unknown) =>
    logger.error(category, message, error),
  security: (category: LogCategory, event: string, data?: unknown) =>
    logger.security(category, event, data),
  reloadConfig: () => logger.reloadConfig(),
  updateConfig: (updates: Partial<LoggerConfig>) =>
    logger.updateConfig(updates),
  getConfig: () => logger.getConfig(),
};
