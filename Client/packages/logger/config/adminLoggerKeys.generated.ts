// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY.
// Modify scripts/log_contracts/categories.yaml, then run: make log-contracts

export const FRONTEND_LOGGER_BOOLEAN_KEYS = [
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
  "transactions",
  "email",
  "profilePreferences",
] as const;

export type FrontendLoggerBooleanKey = (typeof FRONTEND_LOGGER_BOOLEAN_KEYS)[number];

export const SERVER_CORE_LOGGER_BOOLEAN_KEYS = [
  "polling",
  "pages",
  "hooks",
  "auth",
  "http",
  "api",
  "errors",
  "security",
] as const;

export const SERVER_EXTRA_LOGGER_BOOLEAN_KEYS = [
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
  "transactions",
  "email",
  "profilePreferences",
] as const;

export const API_SUBCATEGORY_CONFIG_KEYS = [
  "initialLoad",
  "polling",
  "pageMount",
  "other",
] as const;

export type ApiSubcategoryConfigKey = (typeof API_SUBCATEGORY_CONFIG_KEYS)[number];
