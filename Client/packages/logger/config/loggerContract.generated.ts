// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY.
// Modify scripts/log-contracts/categories.yaml, then run: make log-contracts

import type {
  ApiSubcategoryConfig,
  LoggerConfig,
  LogLevel,
} from "packages/logger/core/loggerTypes";

export const LOGGER_BOOLEAN_KEYS = [
  "polling",
  "pages",
  "hooks",
  "auth",
  "http",
  "errors",
  "security",
  "search",
  "polygonSearch",
  "mapRendering",
  "propertyDetails",
  "negotiation",
  "checklists",
  "calendar",
  "dashboard",
  "messages",
  "feed",
  "routing",
  "docusign",
  "documents",
  "profilePreferences",
] as const;

export type LoggerBooleanKey = (typeof LOGGER_BOOLEAN_KEYS)[number];

const DEFAULT_API_CONFIG: ApiSubcategoryConfig = {
  initialLoad: false,
  polling: false,
  pageMount: false,
  other: false,
};

const PROD_API_CONFIG: ApiSubcategoryConfig = {
  initialLoad: true,
  polling: true,
  pageMount: true,
  other: true,
};

export function buildEnvironmentDefaults(isProd: boolean): LoggerConfig {
  return {
    polling: isProd ? true : false,
    pages: isProd ? true : false,
    hooks: isProd ? true : false,
    auth: isProd ? true : false,
    http: isProd ? true : false,
    api: isProd ? { ...PROD_API_CONFIG } : { ...DEFAULT_API_CONFIG },
    errors: true,
    security: true,
    search: isProd ? true : false,
    polygonSearch: isProd ? true : false,
    mapRendering: isProd ? true : false,
    propertyDetails: isProd ? true : false,
    negotiation: isProd ? true : false,
    checklists: isProd ? true : false,
    calendar: isProd ? true : false,
    dashboard: isProd ? true : false,
    messages: isProd ? true : false,
    feed: isProd ? true : false,
    routing: isProd ? true : false,
    docusign: isProd ? true : false,
    documents: isProd ? true : false,
    profilePreferences: isProd ? true : false,
    logLevel: (isProd ? "INFO" : "ERROR") as LogLevel,
  };
}

export function buildProductionApiConfig(): ApiSubcategoryConfig {
  return { ...PROD_API_CONFIG };
}

export function buildDefaultApiConfig(): ApiSubcategoryConfig {
  return { ...DEFAULT_API_CONFIG };
}

export const DEFAULT_API_CONFIG_EXPORT = DEFAULT_API_CONFIG;
