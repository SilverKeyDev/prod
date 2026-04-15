/**
 * API request/response logging for the compatibility layer
 */

import { log, LOG_CATEGORIES } from "packages/logger";
import { log as secureLog } from "packages/services/security/secureLogger";

export function logApiRequest(method: string, url: string) {
  try {
    const sanitizedUrl = url
      .replace(
        /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        "/:id",
      )
      .replace(/\/\d+/g, "/:id");
    secureLog.info("API_REQUEST", `${method} ${sanitizedUrl}`);
  } catch (err: unknown) {
    log.error(LOG_CATEGORIES.HTTP, "Secure logger call failed", err);
  }
}

export function logApiResponse(
  method: string,
  url: string,
  status: number,
  duration?: number,
) {
  try {
    const sanitizedUrl = url
      .replace(
        /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        "/:id",
      )
      .replace(/\/\d+/g, "/:id");
    const durationText = duration ? ` (${duration}ms)` : "";
    secureLog.info(
      "API_RESPONSE",
      `${method} ${sanitizedUrl} - ${status}${durationText}`,
    );
  } catch (err: unknown) {
    log.error(LOG_CATEGORIES.HTTP, "Secure logger call failed", err);
  }
}
