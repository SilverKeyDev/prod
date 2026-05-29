import type { LoggerConfig } from "packages/logger/core/loggerTypes";

import { resolveLoggerConfig } from "./resolveLoggerConfig";

export function loadLoggerConfigFromBundled(): LoggerConfig {
  return resolveLoggerConfig();
}
