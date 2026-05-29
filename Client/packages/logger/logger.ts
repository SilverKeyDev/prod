/**
 * Centralized Logger with PII scrubbing and environment-aware sinks.
 *
 * Adding New Log Categories:
 * 1. Add the category to logger.config.json (e.g., "search": false)
 * 2. Add to categories.ts, categoryToConfigKey, LOGGER_BOOLEAN_KEYS in resolveLoggerConfig.ts
 * 3. Use: log.info(LOG_CATEGORIES.SEARCH, "message", data)
 *
 * Defaults: prod all categories on + PostHog export; dev all off except ERRORS/SECURITY.
 * Dev opt-in: admin toggles, EXPO_PUBLIC_LOGGER_VERBOSE, EXPO_PUBLIC_LOGGER_CATEGORIES.
 */

import { loadLoggerConfigFromBundled } from "./config/loadLoggerConfig";
import { shouldExportLogsToPostHog } from "./config/loggerEnv";
import { mergeLoggerConfigUpdate, resolveLoggerConfig } from "./config/resolveLoggerConfig";
import type { ApiSubcategory, LogCategory } from "./core/categories";
import { formatLogMessage } from "./core/formatLogMessage";
import type { LoggerConfig } from "./core/loggerTypes";
import type { LogLevel } from "./core/loggerTypes";
import { createSafeLogObject } from "./core/pii";
import { shouldEmitLog } from "./core/shouldEmitLog";
import { emitPostHogLog } from "./sinks/posthogLogSink";
import type { PostHogLogLevel } from "./sinks/posthogLogSink.types";

export type { ApiSubcategoryConfig, LoggerConfig } from "./core/loggerTypes";

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
        const config = (await response.json()) as Partial<LoggerConfig>;
        this.config = resolveLoggerConfig(config);
      }
    } catch (error) {
      this.originalConsole.warn("[Logger] Failed to reload config, using current config", error);
    }
  }

  updateConfig(updates: Partial<LoggerConfig>): void {
    this.config = mergeLoggerConfigUpdate(this.config, updates);
  }

  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }

  private categoryLabel(category: LogCategory | string, subcategory?: ApiSubcategory): string {
    return subcategory && category === "API" ? `${category}:${subcategory}` : category;
  }

  private formatMessage(
    level: LogLevel,
    category: LogCategory | string,
    message: string,
    data?: unknown
  ): string {
    return formatLogMessage(this.formatProcessing, level, category, message, data);
  }

  private emit(
    level: LogLevel,
    posthogLevel: PostHogLogLevel,
    category: LogCategory,
    message: string,
    data?: unknown,
    subcategory?: ApiSubcategory
  ): void {
    if (!shouldEmitLog(this.config, level, category, subcategory)) {
      return;
    }

    const categoryLabel = this.categoryLabel(category, subcategory);
    const scrubbedData = data !== undefined ? createSafeLogObject(data) : undefined;

    if (shouldExportLogsToPostHog()) {
      emitPostHogLog(posthogLevel, categoryLabel, message, scrubbedData, subcategory);
    }

    try {
      const formatted = this.formatMessage(level, categoryLabel, message, scrubbedData);
      const consoleFn = {
        DEBUG: this.originalConsole.debug,
        INFO: this.originalConsole.info,
        WARN: this.originalConsole.warn,
        ERROR: this.originalConsole.error,
      }[level];
      consoleFn(formatted);
    } catch (error) {
      this.originalConsole.error("[Logger] Emit error:", error);
    }
  }

  debug(
    category: LogCategory,
    message: string,
    data?: unknown,
    subcategory?: ApiSubcategory
  ): void {
    this.emit("DEBUG", "DEBUG", category, message, data, subcategory);
  }

  info(category: LogCategory, message: string, data?: unknown, subcategory?: ApiSubcategory): void {
    this.emit("INFO", "INFO", category, message, data, subcategory);
  }

  warn(category: LogCategory, message: string, data?: unknown, subcategory?: ApiSubcategory): void {
    this.emit("WARN", "WARN", category, message, data, subcategory);
  }

  error(
    category: LogCategory,
    message: string,
    error?: unknown,
    subcategory?: ApiSubcategory
  ): void {
    let errorData = error;
    if (error instanceof Error) {
      errorData = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    this.emit("ERROR", "ERROR", category, message, errorData, subcategory);
  }

  security(
    category: LogCategory,
    event: string,
    data?: unknown,
    subcategory?: ApiSubcategory
  ): void {
    const scrubbedData = data ? createSafeLogObject(data) : undefined;
    this.emit("WARN", "SECURITY", category, `\u{1F512} ${event}`, scrubbedData, subcategory);
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
