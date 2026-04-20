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
 *    - Add to LoggerConfig interface in loggerTypes.ts (optional, for type safety)
 * 3. Use the category in code: log.info(LOG_CATEGORIES.SEARCH, "message", data)
 *
 * The logger supports both defined categories (from categories.ts) and future
 * categories (from config JSON) - unknown categories are converted to camelCase
 * and checked against the config.
 */

import type { ApiSubcategory, LogCategory } from "./categories";
import { checkCategoryEnabled } from "./checkCategoryEnabled";
import { formatLogMessage } from "./formatLogMessage";
import { loadLoggerConfigFromBundled } from "./loadLoggerConfig";
import type { LoggerConfig } from "./loggerTypes";
import { LOG_LEVEL_ORDER, type LogLevel } from "./loggerTypes";
import { createSafeLogObject } from "./pii";

export type { ApiSubcategoryConfig, LoggerConfig } from "./loggerTypes";

class Logger {
  private config: LoggerConfig;
  private readonly formatProcessing = { value: false };
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };

  constructor() {
    /* eslint-disable silverkey/no-console-logger -- logger implementation captures console for fallback */
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    };
    /* eslint-enable silverkey/no-console-logger */

    this.config = loadLoggerConfigFromBundled();
  }

  async reloadConfig(): Promise<void> {
    try {
      const response = await fetch("/logger/logger.config.json");
      if (response.ok) {
        const config = await response.json();
        this.config = { ...this.config, ...config };
      }
    } catch (error) {
      this.originalConsole.warn("[Logger] Failed to reload config, using current config", error);
    }
  }

  updateConfig(updates: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }

  private isCategoryEnabled(category: LogCategory | string, subcategory?: ApiSubcategory): boolean {
    return checkCategoryEnabled(this.config, category, subcategory);
  }

  private isLevelEnabled(level: LogLevel): boolean {
    const currentLevel = LOG_LEVEL_ORDER[this.config.logLevel];
    const messageLevel = LOG_LEVEL_ORDER[level];
    return messageLevel >= currentLevel;
  }

  private formatMessage(
    level: LogLevel,
    category: LogCategory | string,
    message: string,
    data?: unknown
  ): string {
    return formatLogMessage(this.formatProcessing, level, category, message, data);
  }

  debug(
    category: LogCategory,
    message: string,
    data?: unknown,
    subcategory?: ApiSubcategory
  ): void {
    if (!this.isCategoryEnabled(category, subcategory) || !this.isLevelEnabled("DEBUG")) {
      return;
    }

    try {
      const categoryLabel =
        subcategory && category === "API" ? `${category}:${subcategory}` : category;
      const formatted = this.formatMessage("DEBUG", categoryLabel, message, data);
      this.originalConsole.debug(formatted);
    } catch (error) {
      this.originalConsole.error("[Logger] Debug error:", error);
    }
  }

  info(category: LogCategory, message: string, data?: unknown, subcategory?: ApiSubcategory): void {
    if (!this.isCategoryEnabled(category, subcategory) || !this.isLevelEnabled("INFO")) {
      return;
    }

    try {
      const categoryLabel =
        subcategory && category === "API" ? `${category}:${subcategory}` : category;
      const formatted = this.formatMessage("INFO", categoryLabel, message, data);
      this.originalConsole.info(formatted);
    } catch (error) {
      this.originalConsole.error("[Logger] Info error:", error);
    }
  }

  warn(category: LogCategory, message: string, data?: unknown, subcategory?: ApiSubcategory): void {
    if (!this.isCategoryEnabled(category, subcategory) || !this.isLevelEnabled("WARN")) {
      return;
    }

    try {
      const categoryLabel =
        subcategory && category === "API" ? `${category}:${subcategory}` : category;
      const formatted = this.formatMessage("WARN", categoryLabel, message, data);
      this.originalConsole.warn(formatted);
    } catch (error) {
      this.originalConsole.error("[Logger] Warn error:", error);
    }
  }

  error(
    category: LogCategory,
    message: string,
    error?: unknown,
    subcategory?: ApiSubcategory
  ): void {
    if (!this.isCategoryEnabled(category, subcategory) || !this.isLevelEnabled("ERROR")) {
      return;
    }

    try {
      let errorData = error;

      if (error instanceof Error) {
        errorData = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      }

      const categoryLabel =
        subcategory && category === "API" ? `${category}:${subcategory}` : category;
      const formatted = this.formatMessage("ERROR", categoryLabel, message, errorData);
      this.originalConsole.error(formatted);
    } catch (err) {
      this.originalConsole.error("[Logger] Error logging error:", err);
    }
  }

  security(
    category: LogCategory,
    event: string,
    data?: unknown,
    subcategory?: ApiSubcategory
  ): void {
    try {
      const scrubbedData = data ? createSafeLogObject(data) : undefined;
      const categoryLabel =
        subcategory && category === "API" ? `${category}:${subcategory}` : category;
      const formatted = this.formatMessage(
        "WARN",
        categoryLabel,
        `\u{1F512} ${event}`,
        scrubbedData
      );
      this.originalConsole.warn(formatted);
    } catch (error) {
      this.originalConsole.error("[Logger] Security logging error:", error);
    }
  }
}

export const logger = new Logger();

export const log = {
  debug: (category: LogCategory, message: string, data?: unknown, subcategory?: ApiSubcategory) =>
    logger.debug(category, message, data, subcategory),
  info: (category: LogCategory, message: string, data?: unknown, subcategory?: ApiSubcategory) =>
    logger.info(category, message, data, subcategory),
  warn: (category: LogCategory, message: string, data?: unknown, subcategory?: ApiSubcategory) =>
    logger.warn(category, message, data, subcategory),
  error: (category: LogCategory, message: string, error?: unknown, subcategory?: ApiSubcategory) =>
    logger.error(category, message, error, subcategory),
  security: (category: LogCategory, event: string, data?: unknown, subcategory?: ApiSubcategory) =>
    logger.security(category, event, data, subcategory),
  reloadConfig: () => logger.reloadConfig(),
  updateConfig: (updates: Partial<LoggerConfig>) => logger.updateConfig(updates),
  getConfig: () => logger.getConfig(),
};
