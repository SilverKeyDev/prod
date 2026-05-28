import bundledLoggerConfig from "./logger.config.json";
import type { LoggerConfig } from "./loggerTypes";

export function loadLoggerConfigFromBundled(): LoggerConfig {
  const defaultConfig: LoggerConfig = {
    polling: true,
    pages: true,
    hooks: true,
    auth: true,
    http: true,
    api: {
      initialLoad: true,
      polling: true,
      pageMount: true,
      other: true,
    },
    errors: true,
    security: true,
    polygonSearch: true,
    docusign: true,
    documents: true,
    mapRendering: true,
    propertyDetails: true,
    profilePreferences: true,
    dashboard: true,
    messages: true,
    routing: true,
    search: true,
    negotiation: true,
    checklists: true,
    calendar: true,
    feed: true,
    logLevel: "DEBUG",
  };

  const bundled = bundledLoggerConfig as Partial<LoggerConfig>;
  return { ...defaultConfig, ...bundled };
}
