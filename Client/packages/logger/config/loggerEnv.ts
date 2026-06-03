/**
 * Logger environment helpers — reads process.env only (no packages/config/env import).
 */

function trimEnv(value: string | undefined): string {
  return (value ?? "").trim();
}

export function isLoggerProduction(): boolean {
  return (process.env.NODE_ENV ?? "development") === "production";
}

export function isLoggerVerboseDev(): boolean {
  return trimEnv(process.env.EXPO_PUBLIC_LOGGER_VERBOSE) === "1";
}

export function parseDevCategoryOverrides(): string[] {
  const raw = trimEnv(process.env.EXPO_PUBLIC_LOGGER_CATEGORIES);
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function shouldExportLogsToPostHog(): boolean {
  if (isLoggerProduction()) {
    return true;
  }
  return trimEnv(process.env.EXPO_PUBLIC_LOGGER_POSTHOG) === "1";
}
