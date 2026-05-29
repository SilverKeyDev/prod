import type { LogLevel } from "./loggerTypes";
import { LOG_LEVEL_ORDER } from "./loggerTypes";

export function isLogLevelEnabled(configLevel: LogLevel, messageLevel: LogLevel): boolean {
  return LOG_LEVEL_ORDER[messageLevel] >= LOG_LEVEL_ORDER[configLevel];
}
