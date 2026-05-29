import { isLoggerProduction, isLoggerVerboseDev, parseDevCategoryOverrides } from "./loggerEnv";
import type { ApiSubcategoryConfig, LoggerConfig, LogLevel } from "./loggerTypes";

export const LOGGER_BOOLEAN_KEYS = [
  "polling",
  "pages",
  "hooks",
  "auth",
  "http",
  "errors",
  "security",
  "polygonSearch",
  "docusign",
  "documents",
  "mapRendering",
  "propertyDetails",
  "profilePreferences",
  "dashboard",
  "messages",
  "routing",
  "search",
  "negotiation",
  "checklists",
  "calendar",
  "feed",
] as const;

export type LoggerBooleanKey = (typeof LOGGER_BOOLEAN_KEYS)[number];

const DEFAULT_API_CONFIG: ApiSubcategoryConfig = {
  initialLoad: false,
  polling: false,
  pageMount: false,
  other: false,
};

export function buildEnvironmentDefaults(isProd: boolean): LoggerConfig {
  const boolValue = isProd;
  const apiValue: ApiSubcategoryConfig | boolean = isProd
    ? {
        initialLoad: true,
        polling: true,
        pageMount: true,
        other: true,
      }
    : { ...DEFAULT_API_CONFIG };

  const config: LoggerConfig = {
    polling: boolValue,
    pages: boolValue,
    hooks: boolValue,
    auth: boolValue,
    http: boolValue,
    api: apiValue,
    errors: true,
    security: true,
    polygonSearch: boolValue,
    docusign: boolValue,
    documents: boolValue,
    mapRendering: boolValue,
    propertyDetails: boolValue,
    profilePreferences: boolValue,
    dashboard: boolValue,
    messages: boolValue,
    routing: boolValue,
    search: boolValue,
    negotiation: boolValue,
    checklists: boolValue,
    calendar: boolValue,
    feed: boolValue,
    logLevel: isProd ? "INFO" : "ERROR",
  };

  return config;
}

function mergeApiConfig(
  base: LoggerConfig["api"],
  override: LoggerConfig["api"] | undefined
): LoggerConfig["api"] {
  if (override === undefined) {
    return base;
  }
  if (typeof override === "boolean") {
    if (override) {
      return {
        initialLoad: true,
        polling: true,
        pageMount: true,
        other: true,
      };
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
      next.api = {
        initialLoad: true,
        polling: true,
        pageMount: true,
        other: true,
      };
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
  next.api = {
    initialLoad: true,
    polling: true,
    pageMount: true,
    other: true,
  };
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
  next.api = {
    initialLoad: true,
    polling: true,
    pageMount: true,
    other: true,
  };
  return next;
}

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
