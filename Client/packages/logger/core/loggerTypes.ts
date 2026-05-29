export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface ApiSubcategoryConfig {
  initialLoad: boolean;
  polling: boolean;
  pageMount: boolean;
  other: boolean;
}

export interface LoggerConfig {
  polling: boolean;
  pages: boolean;
  hooks: boolean;
  auth: boolean;
  http: boolean;
  api: boolean | ApiSubcategoryConfig;
  errors: boolean;
  security: boolean;
  search?: boolean;
  polygonSearch?: boolean;
  negotiation?: boolean;
  checklists?: boolean;
  calendar?: boolean;
  dashboard?: boolean;
  messages?: boolean;
  routing?: boolean;
  docusign?: boolean;
  documents?: boolean;
  mapRendering?: boolean;
  propertyDetails?: boolean;
  profilePreferences?: boolean;
  logLevel: LogLevel;
  // Allow additional category flags for future categories
  [key: string]: boolean | LogLevel | ApiSubcategoryConfig | undefined;
}

export const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};
