/**
 * Logger Category Definitions
 * Type-safe category constants and helpers
 */

export type LogCategory =
  | "POLLING"
  | "INITIAL_API_CALLS"
  | "PAGES"
  | "HOOKS"
  | "AUTH"
  | "HTTP"
  | "API"
  | "ERRORS"
  | "SECURITY";

export const LOG_CATEGORIES = {
  POLLING: "POLLING",
  INITIAL_API_CALLS: "INITIAL_API_CALLS",
  PAGES: "PAGES",
  HOOKS: "HOOKS",
  AUTH: "AUTH",
  HTTP: "HTTP",
  API: "API",
  ERRORS: "ERRORS",
  SECURITY: "SECURITY",
} as const;

/**
 * Map category to config key
 */
export function categoryToConfigKey(category: LogCategory): string {
  const mapping: Record<LogCategory, string> = {
    POLLING: "polling",
    INITIAL_API_CALLS: "initialApiCalls",
    PAGES: "pages",
    HOOKS: "hooks",
    AUTH: "auth",
    HTTP: "http",
    API: "api",
    ERRORS: "errors",
    SECURITY: "security",
  };
  return mapping[category];
}

/**
 * Check if a category should always be enabled (errors and security)
 */
export function isAlwaysEnabled(category: LogCategory): boolean {
  return category === "ERRORS" || category === "SECURITY";
}
