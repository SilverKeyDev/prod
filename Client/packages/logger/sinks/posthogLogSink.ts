import posthog from "posthog-js";

import { createSafeLogObject } from "packages/logger/core/pii";

import type { PostHogLogLevel } from "./posthogLogSink.types";

const SERVICE_NAME = "silverkey-web";

function posthogLoggerReady(): boolean {
  return typeof posthog.logger?.info === "function";
}

function buildAttributes(
  category: string,
  subcategory: string | undefined,
  data: unknown
): Record<string, string | number | boolean> {
  const attributes: Record<string, string | number | boolean> = {
    "log.category": category,
    "log.source": "silverkey-logger",
    "service.name": SERVICE_NAME,
  };
  if (subcategory) {
    attributes["log.subcategory"] = subcategory;
  }
  if (data !== undefined && data !== null) {
    attributes["log.data"] = JSON.stringify(createSafeLogObject(data));
  }
  return attributes;
}

function emitWithLogger(
  level: PostHogLogLevel,
  message: string,
  attributes: Record<string, string | number | boolean>
): void {
  const logger = posthog.logger;
  if (!logger) {
    return;
  }

  switch (level) {
    case "DEBUG":
      logger.debug?.(message, attributes);
      break;
    case "INFO":
      logger.info?.(message, attributes);
      break;
    case "WARN":
    case "SECURITY":
      logger.warn?.(message, attributes);
      break;
    case "ERROR":
      logger.error?.(message, attributes);
      break;
    default:
      logger.info?.(message, attributes);
  }
}

export function emitPostHogLog(
  level: PostHogLogLevel,
  category: string,
  message: string,
  data?: unknown,
  subcategory?: string
): void {
  if (!posthogLoggerReady()) {
    return;
  }

  try {
    const attributes = buildAttributes(category, subcategory, data);
    emitWithLogger(level, message, attributes);
  } catch {
    // PostHog must never break application logging
  }
}
