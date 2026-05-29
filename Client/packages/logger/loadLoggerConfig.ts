import bundledLoggerConfig from "./logger.config.json";
import type { LoggerConfig } from "./loggerTypes";
import { resolveLoggerConfig } from "./resolveLoggerConfig";

export function loadLoggerConfigFromBundled(): LoggerConfig {
  const bundled = bundledLoggerConfig as Partial<LoggerConfig>;
  return resolveLoggerConfig(bundled);
}
