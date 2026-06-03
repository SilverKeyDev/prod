import type {
  ApiSubcategoryConfig,
  LoggerConfig,
  LogLevel,
} from "packages/logger/core/loggerTypes";

import {
  buildEnvironmentDefaults,
  buildProductionApiConfig,
  DEFAULT_API_CONFIG_EXPORT,
  LOGGER_BOOLEAN_KEYS,
  type LoggerBooleanKey,
} from "./loggerContract.generated";
import { isLoggerProduction, isLoggerVerboseDev, parseDevCategoryOverrides } from "./loggerEnv";

export { LOGGER_BOOLEAN_KEYS, type LoggerBooleanKey };

const DEFAULT_API_CONFIG: ApiSubcategoryConfig = DEFAULT_API_CONFIG_EXPORT;

function mergeApiConfig(
  base: LoggerConfig["api"],
  override: LoggerConfig["api"] | undefined
): LoggerConfig["api"] {
  if (override === undefined) {
    return base;
  }
  if (typeof override === "boolean") {
    if (override) {
      return buildProductionApiConfig();
    }
    return { ...DEFAULT_API_CONFIG };
  }
  if (typeof base === "boolean") {
    return override;
  }
  return { ...base, ...override };
}

function applyDevCategoryOverrides(config: LoggerConfig, keys: string[]): LoggerConfig {
  if (keys.length === 0) {
    return config;
  }

  const next = { ...config };
  for (const key of keys) {
    if (key === "api") {
      next.api = buildProductionApiConfig();
      continue;
    }
    if (LOGGER_BOOLEAN_KEYS.includes(key as LoggerBooleanKey)) {
      (next as Record<string, unknown>)[key] = true;
    }
  }
  return next;
}

function applyDevVerbose(config: LoggerConfig): LoggerConfig {
  const next = { ...config };
  for (const key of LOGGER_BOOLEAN_KEYS) {
    if (key === "errors" || key === "security") {
      continue;
    }
    (next as Record<string, unknown>)[key] = true;
  }
  next.api = buildProductionApiConfig();
  next.logLevel = "DEBUG";
  return next;
}

export function applyProductionGuard(config: LoggerConfig): LoggerConfig {
  const next = { ...config };
  for (const key of LOGGER_BOOLEAN_KEYS) {
    (next as Record<string, unknown>)[key] = true;
  }
  next.errors = true;
  next.security = true;
  next.api = buildProductionApiConfig();
  return next;
}

export { buildEnvironmentDefaults };

export function resolveLoggerConfig(overrides?: Partial<LoggerConfig>): LoggerConfig {
  const isProd = isLoggerProduction();
  let config = buildEnvironmentDefaults(isProd);

  if (overrides) {
    config = {
      ...config,
      ...overrides,
      api: mergeApiConfig(config.api, overrides.api),
    };
  }

  if (!isProd) {
    if (isLoggerVerboseDev()) {
      config = applyDevVerbose(config);
    } else {
      config = applyDevCategoryOverrides(config, parseDevCategoryOverrides());
    }
  } else {
    config = applyProductionGuard(config);
  }

  return config;
}

export function mergeLoggerConfigUpdate(
  current: LoggerConfig,
  updates: Partial<LoggerConfig>
): LoggerConfig {
  const merged: LoggerConfig = {
    ...current,
    ...updates,
    api: mergeApiConfig(current.api, updates.api),
  };

  if (isLoggerProduction()) {
    return applyProductionGuard(merged);
  }

  return merged;
}

export function normalizeLogLevel(value: unknown, fallback: LogLevel): LogLevel {
  if (value === "DEBUG" || value === "INFO" || value === "WARN" || value === "ERROR") {
    return value;
  }
  return fallback;
}
