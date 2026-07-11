// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY.
// Modify scripts/log_contracts/categories.yaml, then run: make log-contracts

export type LogCategory =
  | "POLLING"
  | "PAGES"
  | "HOOKS"
  | "AUTH"
  | "HTTP"
  | "API"
  | "ERRORS"
  | "SECURITY"
  | "SEARCH"
  | "POLYGON_SEARCH"
  | "MAP_RENDERING"
  | "PROPERTY_DETAILS"
  | "NEGOTIATION"
  | "CHECKLISTS"
  | "CALENDAR"
  | "DASHBOARD"
  | "MESSAGES"
  | "FEED"
  | "ROUTING"
  | "DOCUSIGN"
  | "DOCUMENTS"
  | "TRANSACTIONS"
  | "PROFILE_PREFERENCES";

export type ApiSubcategory = "INITIAL_LOAD" | "POLLING" | "PAGE_MOUNT" | "OTHER";

export type LogPath =
  | "POLLING"
  | "PAGES"
  | "HOOKS"
  | "AUTH"
  | "HTTP"
  | "API"
  | "API.INITIAL_LOAD"
  | "API.POLLING"
  | "API.PAGE_MOUNT"
  | "API.OTHER"
  | "ERRORS"
  | "SECURITY"
  | "SEARCH"
  | "POLYGON_SEARCH"
  | "MAP_RENDERING"
  | "PROPERTY_DETAILS"
  | "NEGOTIATION"
  | "CHECKLISTS"
  | "CALENDAR"
  | "DASHBOARD"
  | "MESSAGES"
  | "FEED"
  | "ROUTING"
  | "DOCUSIGN"
  | "DOCUMENTS"
  | "TRANSACTIONS"
  | "TRANSACTIONS.BBA_REVIEW"
  | "PROFILE_PREFERENCES";

export const LOG_CATEGORIES = {
  POLLING: "POLLING",
  PAGES: "PAGES",
  HOOKS: "HOOKS",
  AUTH: "AUTH",
  HTTP: "HTTP",
  API: "API",
  ERRORS: "ERRORS",
  SECURITY: "SECURITY",
  SEARCH: "SEARCH",
  POLYGON_SEARCH: "POLYGON_SEARCH",
  MAP_RENDERING: "MAP_RENDERING",
  PROPERTY_DETAILS: "PROPERTY_DETAILS",
  NEGOTIATION: "NEGOTIATION",
  CHECKLISTS: "CHECKLISTS",
  CALENDAR: "CALENDAR",
  DASHBOARD: "DASHBOARD",
  MESSAGES: "MESSAGES",
  FEED: "FEED",
  ROUTING: "ROUTING",
  DOCUSIGN: "DOCUSIGN",
  DOCUMENTS: "DOCUMENTS",
  TRANSACTIONS: "TRANSACTIONS",
  PROFILE_PREFERENCES: "PROFILE_PREFERENCES",
} as const;

export const API_SUBCATEGORIES = {
  INITIAL_LOAD: "INITIAL_LOAD",
  POLLING: "POLLING",
  PAGE_MOUNT: "PAGE_MOUNT",
  OTHER: "OTHER",
} as const;

export const LOG_PATHS = [
  "POLLING",
  "PAGES",
  "HOOKS",
  "AUTH",
  "HTTP",
  "API",
  "API.INITIAL_LOAD",
  "API.POLLING",
  "API.PAGE_MOUNT",
  "API.OTHER",
  "ERRORS",
  "SECURITY",
  "SEARCH",
  "POLYGON_SEARCH",
  "MAP_RENDERING",
  "PROPERTY_DETAILS",
  "NEGOTIATION",
  "CHECKLISTS",
  "CALENDAR",
  "DASHBOARD",
  "MESSAGES",
  "FEED",
  "ROUTING",
  "DOCUSIGN",
  "DOCUMENTS",
  "TRANSACTIONS",
  "TRANSACTIONS.BBA_REVIEW",
  "PROFILE_PREFERENCES",
] as const;

export function apiSubcategoryToConfigKey(subcategory: ApiSubcategory): string {
  const mapping: Record<ApiSubcategory, string> = {
    INITIAL_LOAD: "initialLoad",
    POLLING: "polling",
    PAGE_MOUNT: "pageMount",
    OTHER: "other",
  };
  return mapping[subcategory];
}

export function categoryToConfigKey(category: LogCategory): string {
  const mapping: Record<LogCategory, string> = {
    POLLING: "polling",
    PAGES: "pages",
    HOOKS: "hooks",
    AUTH: "auth",
    HTTP: "http",
    API: "api",
    ERRORS: "errors",
    SECURITY: "security",
    SEARCH: "search",
    POLYGON_SEARCH: "polygonSearch",
    MAP_RENDERING: "mapRendering",
    PROPERTY_DETAILS: "propertyDetails",
    NEGOTIATION: "negotiation",
    CHECKLISTS: "checklists",
    CALENDAR: "calendar",
    DASHBOARD: "dashboard",
    MESSAGES: "messages",
    FEED: "feed",
    ROUTING: "routing",
    DOCUSIGN: "docusign",
    DOCUMENTS: "documents",
    TRANSACTIONS: "transactions",
    PROFILE_PREFERENCES: "profilePreferences",
  };
  return mapping[category];
}

export function isAlwaysEnabled(category: LogCategory): boolean {
  return category === "ERRORS" || category === "SECURITY";
}

export const ALWAYS_ENABLED_CATEGORIES: ReadonlySet<LogCategory> = new Set(["ERRORS", "SECURITY"]);
