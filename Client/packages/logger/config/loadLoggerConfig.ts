import type { LoggerConfig } from "packages/logger/core/loggerTypes";

import bundledLoggerConfig from "./logger.config.json";
import { resolveLoggerConfig } from "./resolveLoggerConfig";

export function loadLoggerConfigFromBundled(): LoggerConfig {
  const bundled = bundledLoggerConfig as Partial<LoggerConfig>;
  return resolveLoggerConfig(bundled);
}
