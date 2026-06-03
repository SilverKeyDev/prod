// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY.
// Modify scripts/log_contracts/categories.yaml, then run: make log-contracts

/** Admin Logging UI groups derived from categories.yaml (config key → log path label). */
export const LOGGER_CONFIG_KEY_TO_LOG_PATH: Record<string, string> = {
  polling: "POLLING",
  pages: "PAGES",
  hooks: "HOOKS",
  auth: "AUTH",
  http: "HTTP",
  api: "API",
  errors: "ERRORS",
  security: "SECURITY",
  search: "SEARCH",
  polygonSearch: "POLYGON_SEARCH",
  mapRendering: "MAP_RENDERING",
  propertyDetails: "PROPERTY_DETAILS",
  negotiation: "NEGOTIATION",
  checklists: "CHECKLISTS",
  calendar: "CALENDAR",
  dashboard: "DASHBOARD",
  messages: "MESSAGES",
  feed: "FEED",
  routing: "ROUTING",
  docusign: "DOCUSIGN",
  documents: "DOCUMENTS",
  profilePreferences: "PROFILE_PREFERENCES",
};

export const ADMIN_LOGGER_UI_GROUPS = {
  core: {
    title: "Core",
    keys: ["polling", "pages", "hooks", "auth", "http"] as const,
  },
  features: {
    title: "Features",
    keys: [
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
    ] as const,
  },
  alwaysEnabled: {
    title: "Always on",
    keys: ["errors", "security"] as const,
  },
} as const;

export type AdminLoggerUiGroupKey = keyof typeof ADMIN_LOGGER_UI_GROUPS;

export const API_SUBCATEGORY_CONFIG_KEY_TO_LOG_PATH: Record<string, string> = {
  initialLoad: "API.INITIAL_LOAD",
  polling: "API.POLLING",
  pageMount: "API.PAGE_MOUNT",
  other: "API.OTHER",
};
