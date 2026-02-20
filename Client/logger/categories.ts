/**
 * Logger Category Definitions
 * Type-safe category constants and helpers
 */

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
  | "MAP_RENDERING"
  | "NEGOTIATION"
  | "CHECKLISTS"
  | "CALENDAR"
  | "DASHBOARD"
  | "MESSAGES"
  | "FEED";

export type ApiSubcategory =
  | "INITIAL_LOAD"
  | "POLLING"
  | "PAGE_MOUNT"
  | "OTHER";

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
  MAP_RENDERING: "MAP_RENDERING",
  NEGOTIATION: "NEGOTIATION",
  CHECKLISTS: "CHECKLISTS",
  CALENDAR: "CALENDAR",
  DASHBOARD: "DASHBOARD",
  MESSAGES: "MESSAGES",
  FEED: "FEED",
} as const;

export const API_SUBCATEGORIES = {
  INITIAL_LOAD: "INITIAL_LOAD",
  POLLING: "POLLING",
  PAGE_MOUNT: "PAGE_MOUNT",
  OTHER: "OTHER",
} as const;

/**
 * Map API subcategory to config key
 */
export function apiSubcategoryToConfigKey(subcategory: ApiSubcategory): string {
  const mapping: Record<ApiSubcategory, string> = {
    INITIAL_LOAD: "initialLoad",
    POLLING: "polling",
    PAGE_MOUNT: "pageMount",
    OTHER: "other",
  };
  return mapping[subcategory];
}

/**
 * Map category to config key
 */
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
    MAP_RENDERING: "mapRendering",
    NEGOTIATION: "negotiation",
    CHECKLISTS: "checklists",
    CALENDAR: "calendar",
    DASHBOARD: "dashboard",
    MESSAGES: "messages",
    FEED: "feed",
  };
  return mapping[category];
}

/**
 * Check if a category should always be enabled (errors and security)
 */
export function isAlwaysEnabled(category: LogCategory): boolean {
  return category === "ERRORS" || category === "SECURITY";
}
