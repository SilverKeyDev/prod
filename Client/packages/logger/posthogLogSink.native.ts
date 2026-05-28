import { getPostHogNativeClient } from "packages/services/analytics/posthogClient";

import { createSafeLogObject } from "./pii";
import type { PostHogLogLevel } from "./posthogLogSink.types";

const SERVICE_NAME = "silverkey-mobile";

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

function mapLevel(level: PostHogLogLevel): "debug" | "info" | "warn" | "error" {
  switch (level) {
    case "DEBUG":
      return "debug";
    case "INFO":
      return "info";
    case "WARN":
    case "SECURITY":
      return "warn";
    case "ERROR":
      return "error";
    default:
      return "info";
  }
}

export function emitPostHogLog(
  level: PostHogLogLevel,
  category: string,
  message: string,
  data?: unknown,
  subcategory?: string
): void {
  const posthog = getPostHogNativeClient();
  if (!posthog?.logger) {
    return;
  }

  try {
    const attributes = buildAttributes(category, subcategory, data);
    const severity = mapLevel(level);
    const logger = posthog.logger;
    switch (severity) {
      case "debug":
        logger.debug?.(message, attributes);
        break;
      case "info":
        logger.info?.(message, attributes);
        break;
      case "warn":
        logger.warn?.(message, attributes);
        break;
      case "error":
        logger.error?.(message, attributes);
        break;
      default:
        logger.info?.(message, attributes);
    }
  } catch {
    // PostHog must never break application logging
  }
}

export type { PostHogLogLevel } from "./posthogLogSink.types";
