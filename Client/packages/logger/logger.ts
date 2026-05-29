/**
 * Centralized Logger with PII scrubbing and environment-aware sinks.
 *
 * Adding new log categories:
 * 1. Edit scripts/log-contracts/categories.yaml
 * 2. Run: make log-contracts
 * 3. Use: log.info(LOG_CATEGORIES.SEARCH, "message", data) or log.info("SEARCH", "message", data)
 *
 * Defaults: prod all categories on + PostHog export; dev all off except ERRORS/SECURITY.
 * Dev opt-in: admin toggles, EXPO_PUBLIC_LOGGER_VERBOSE, EXPO_PUBLIC_LOGGER_CATEGORIES.
 */

import { loadLoggerConfigFromBundled } from "./config/loadLoggerConfig";
import { shouldExportLogsToPostHog } from "./config/loggerEnv";
import { mergeLoggerConfigUpdate, resolveLoggerConfig } from "./config/resolveLoggerConfig";
import type { ApiSubcategory, LogCategory, LogPath } from "./core/categories";
import { LOG_CATEGORIES } from "./core/categories";
import { formatLogMessage } from "./core/formatLogMessage";
import type { LoggerConfig } from "./core/loggerTypes";
import type { LogLevel } from "./core/loggerTypes";
import { parseLogPath } from "./core/parseLogPath";
import { createSafeLogObject } from "./core/pii";
import { shouldEmitLog } from "./core/shouldEmitLog";
import { emitPostHogLog } from "./sinks/posthogLogSink";
import type { PostHogLogLevel } from "./sinks/posthogLogSink.types";

export type { ApiSubcategoryConfig, LoggerConfig } from "./core/loggerTypes";

type CategoryInput = LogCategory | LogPath | string;

type ResolvedCategoryInput = {
  category: LogCategory;
  subcategory?: ApiSubcategory;
  categoryLabel: string;
};

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

  reloadConfig(): void {
    this.config = resolveLoggerConfig();
  }

  updateConfig(updates: Partial<LoggerConfig>): void {
    this.config = mergeLoggerConfigUpdate(this.config, updates);
  }

  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }

  private resolveCategoryInput(
    categoryOrPath: CategoryInput,
    explicitSubcategory?: ApiSubcategory
  ): ResolvedCategoryInput {
    if (
      explicitSubcategory !== undefined &&
      typeof categoryOrPath === "string" &&
      categoryOrPath in LOG_CATEGORIES
    ) {
      const category = categoryOrPath as LogCategory;
      return {
        category,
        subcategory: explicitSubcategory,
        categoryLabel:
          explicitSubcategory && category === "API"
            ? `${category}:${explicitSubcategory}`
            : category,
      };
    }

    const parsed = parseLogPath(categoryOrPath);
    return {
      category: parsed.category,
      subcategory: parsed.subcategory,
      categoryLabel: parsed.categoryLabel,
    };
  }

  private formatMessage(
    level: LogLevel,
    categoryLabel: string,
    message: string,
    data?: unknown
  ): string {
    return formatLogMessage(this.formatProcessing, level, categoryLabel, message, data);
  }

  private emit(
    level: LogLevel,
    posthogLevel: PostHogLogLevel,
    categoryOrPath: CategoryInput,
    message: string,
    data?: unknown,
    explicitSubcategory?: ApiSubcategory
  ): void {
    const resolved = this.resolveCategoryInput(categoryOrPath, explicitSubcategory);
    if (!shouldEmitLog(this.config, level, resolved.category, resolved.subcategory)) {
      return;
    }

    const scrubbedData = data !== undefined ? createSafeLogObject(data) : undefined;

    if (shouldExportLogsToPostHog()) {
      emitPostHogLog(
        posthogLevel,
        resolved.categoryLabel,
        message,
        scrubbedData,
        resolved.subcategory
      );
    }

    try {
      const formatted = this.formatMessage(level, resolved.categoryLabel, message, scrubbedData);
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

  debug(category: LogCategory, message: string, data?: unknown, subcategory?: ApiSubcategory): void;
  debug(path: LogPath, message: string, data?: unknown): void;
  debug(
    categoryOrPath: CategoryInput,
    message: string,
    data?: unknown,
    subcategory?: ApiSubcategory
  ): void {
    this.emit("DEBUG", "DEBUG", categoryOrPath, message, data, subcategory);
  }

  info(category: LogCategory, message: string, data?: unknown, subcategory?: ApiSubcategory): void;
  info(path: LogPath, message: string, data?: unknown): void;
  info(
    categoryOrPath: CategoryInput,
    message: string,
    data?: unknown,
    subcategory?: ApiSubcategory
  ): void {
    this.emit("INFO", "INFO", categoryOrPath, message, data, subcategory);
  }

  warn(category: LogCategory, message: string, data?: unknown, subcategory?: ApiSubcategory): void;
  warn(path: LogPath, message: string, data?: unknown): void;
  warn(
    categoryOrPath: CategoryInput,
    message: string,
    data?: unknown,
    subcategory?: ApiSubcategory
  ): void {
    this.emit("WARN", "WARN", categoryOrPath, message, data, subcategory);
  }

  error(
    category: LogCategory,
    message: string,
    error?: unknown,
    subcategory?: ApiSubcategory
  ): void;
  error(path: LogPath, message: string, error?: unknown): void;
  error(
    categoryOrPath: CategoryInput,
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
    this.emit("ERROR", "ERROR", categoryOrPath, message, errorData, subcategory);
  }

  security(
    category: LogCategory,
    event: string,
    data?: unknown,
    subcategory?: ApiSubcategory
  ): void;
  security(path: LogPath, event: string, data?: unknown): void;
  security(
    categoryOrPath: CategoryInput,
    event: string,
    data?: unknown,
    subcategory?: ApiSubcategory
  ): void {
    const scrubbedData = data ? createSafeLogObject(data) : undefined;
    this.emit(
      "SECURITY",
      "SECURITY",
      categoryOrPath,
      `\u{1F512} ${event}`,
      scrubbedData,
      subcategory
    );
  }
}

export const logger = new Logger();

type LogMethod = {
  (category: LogCategory, message: string, data?: unknown, subcategory?: ApiSubcategory): void;
  (path: LogPath, message: string, data?: unknown): void;
};

export const log = {
  debug: ((categoryOrPath, message, data, subcategory) =>
    logger.debug(categoryOrPath, message, data, subcategory)) as LogMethod,
  info: ((categoryOrPath, message, data, subcategory) =>
    logger.info(categoryOrPath, message, data, subcategory)) as LogMethod,
  warn: ((categoryOrPath, message, data, subcategory) =>
    logger.warn(categoryOrPath, message, data, subcategory)) as LogMethod,
  error: ((categoryOrPath, message, error, subcategory) =>
    logger.error(categoryOrPath, message, error, subcategory)) as LogMethod,
  security: ((categoryOrPath, event, data, subcategory) =>
    logger.security(categoryOrPath, event, data, subcategory)) as LogMethod,
  reloadConfig: () => logger.reloadConfig(),
  updateConfig: (updates: Partial<LoggerConfig>) => logger.updateConfig(updates),
  getConfig: () => logger.getConfig(),
};
