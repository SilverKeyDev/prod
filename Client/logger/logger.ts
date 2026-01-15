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

import type { LogCategory, ApiSubcategory } from "./categories";
import {
  LOG_CATEGORIES,
  categoryToConfigKey,
  isAlwaysEnabled,
  apiSubcategoryToConfigKey,
} from "./categories";
import {
  scrubPII,
  maskSensitiveData,
  createSafeLogObject,
} from "./pii";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface ApiSubcategoryConfig {
  initialLoad: boolean;
  polling: boolean;
  pageMount: boolean;
  other: boolean;
}

export interface LoggerConfig {
  polling: boolean;
  pages: boolean;
  hooks: boolean;
  auth: boolean;
  http: boolean;
  api: boolean | ApiSubcategoryConfig;
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
  [key: string]: boolean | LogLevel | ApiSubcategoryConfig | undefined;
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
      pages: true,
      hooks: true,
      auth: true,
      http: true,
      api: {
        initialLoad: true,
        polling: true,
        pageMount: true,
        other: true,
      },
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
   * Supports API subcategories when category is "API"
   */
  private isCategoryEnabled(
    category: LogCategory | string,
    subcategory?: ApiSubcategory,
  ): boolean {
    // Safety check: handle undefined/null categories
    if (!category || typeof category !== "string") {
      return false;
    }

    // Check if it's a known category that's always enabled
    if (category in LOG_CATEGORIES) {
      const logCategory = category as LogCategory;
      if (isAlwaysEnabled(logCategory)) {
        return true;
      }
    }

    // Try to get config key from category mapping (for defined categories)
    let configKey: string;
    try {
      if (category in LOG_CATEGORIES) {
        configKey = categoryToConfigKey(category as LogCategory);
      } else {
        // For future categories not yet in categories.ts, convert to camelCase
        // e.g., "SEARCH" -> "search"
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

    // Check config
    const configValue = this.config[configKey as keyof LoggerConfig];

    // Handle API subcategories
    if (category === "API" || configKey === "api") {
      // If API config is an object (subcategories), check the subcategory
      if (typeof configValue === "object" && configValue !== null) {
        const apiConfig = configValue as ApiSubcategoryConfig;
        if (subcategory) {
          const subcategoryKey = apiSubcategoryToConfigKey(subcategory);
          return apiConfig[subcategoryKey as keyof ApiSubcategoryConfig] === true;
        }
        // If no subcategory specified, check if any subcategory is enabled
        return (
          apiConfig.initialLoad === true ||
          apiConfig.polling === true ||
          apiConfig.pageMount === true ||
          apiConfig.other === true
        );
      }
      // Backward compatibility: if API config is a boolean, use it directly
      return configValue === true;
    }

    // For other categories, check boolean value - default to false if not found
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
  debug(
    category: LogCategory,
    message: string,
    data?: unknown,
    subcategory?: ApiSubcategory,
  ): void {
    if (
      !this.isCategoryEnabled(category, subcategory) ||
      !this.isLevelEnabled("DEBUG")
    ) {
      return;
    }

    try {
      const categoryLabel =
        subcategory && category === "API"
          ? `${category}:${subcategory}`
          : category;
      const formatted = this.formatMessage("DEBUG", categoryLabel, message, data);
      this.originalConsole.debug(formatted);
    } catch (error) {
      this.originalConsole.error("[Logger] Debug error:", error);
    }
  }

  /**
   * Info logging
   */
  info(
    category: LogCategory,
    message: string,
    data?: unknown,
    subcategory?: ApiSubcategory,
  ): void {
    if (
      !this.isCategoryEnabled(category, subcategory) ||
      !this.isLevelEnabled("INFO")
    ) {
      return;
    }

    try {
      const categoryLabel =
        subcategory && category === "API"
          ? `${category}:${subcategory}`
          : category;
      const formatted = this.formatMessage("INFO", categoryLabel, message, data);
      this.originalConsole.info(formatted);
    } catch (error) {
      this.originalConsole.error("[Logger] Info error:", error);
    }
  }

  /**
   * Warning logging
   */
  warn(
    category: LogCategory,
    message: string,
    data?: unknown,
    subcategory?: ApiSubcategory,
  ): void {
    if (
      !this.isCategoryEnabled(category, subcategory) ||
      !this.isLevelEnabled("WARN")
    ) {
      return;
    }

    try {
      const categoryLabel =
        subcategory && category === "API"
          ? `${category}:${subcategory}`
          : category;
      const formatted = this.formatMessage("WARN", categoryLabel, message, data);
      this.originalConsole.warn(formatted);
    } catch (error) {
      this.originalConsole.error("[Logger] Warn error:", error);
    }
  }

  /**
   * Error logging
   */
  error(
    category: LogCategory,
    message: string,
    error?: unknown,
    subcategory?: ApiSubcategory,
  ): void {
    if (
      !this.isCategoryEnabled(category, subcategory) ||
      !this.isLevelEnabled("ERROR")
    ) {
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

      const categoryLabel =
        subcategory && category === "API"
          ? `${category}:${subcategory}`
          : category;
      const formatted = this.formatMessage(
        "ERROR",
        categoryLabel,
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
  security(
    category: LogCategory,
    event: string,
    data?: unknown,
    subcategory?: ApiSubcategory,
  ): void {
    try {
      const scrubbedData = data ? createSafeLogObject(data) : undefined;
      const categoryLabel =
        subcategory && category === "API"
          ? `${category}:${subcategory}`
          : category;
      const formatted = this.formatMessage(
        "WARN",
        categoryLabel,
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
  debug: (
    category: LogCategory,
    message: string,
    data?: unknown,
    subcategory?: ApiSubcategory,
  ) => logger.debug(category, message, data, subcategory),
  info: (
    category: LogCategory,
    message: string,
    data?: unknown,
    subcategory?: ApiSubcategory,
  ) => logger.info(category, message, data, subcategory),
  warn: (
    category: LogCategory,
    message: string,
    data?: unknown,
    subcategory?: ApiSubcategory,
  ) => logger.warn(category, message, data, subcategory),
  error: (
    category: LogCategory,
    message: string,
    error?: unknown,
    subcategory?: ApiSubcategory,
  ) => logger.error(category, message, error, subcategory),
  security: (
    category: LogCategory,
    event: string,
    data?: unknown,
    subcategory?: ApiSubcategory,
  ) => logger.security(category, event, data, subcategory),
  reloadConfig: () => logger.reloadConfig(),
  updateConfig: (updates: Partial<LoggerConfig>) =>
    logger.updateConfig(updates),
  getConfig: () => logger.getConfig(),
};
