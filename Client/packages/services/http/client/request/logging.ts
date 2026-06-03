import { API_SUBCATEGORIES, log } from "packages/logger";

const POLLING_ENDPOINTS = [
  "/api/v1/agent/notification-counter",
  "/api/v1/agent/chats",
  "/api/v1/user/preferences",
  "/api/v1/user/saved-homes",
  "/api/v1/user/favorite-homes",
];

export function isPollingEndpoint(url: string): boolean {
  return POLLING_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

export function getApiSubcategory(
  url: string
): (typeof API_SUBCATEGORIES)[keyof typeof API_SUBCATEGORIES] | undefined {
  if (isPollingEndpoint(url)) {
    return API_SUBCATEGORIES.POLLING;
  }
  return undefined;
}

function sanitizeUrlForLog(url: string): string {
  return url
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:id")
    .replace(/\/\d+/g, "/:id");
}

export function logApiRequest(method: string, url: string): void {
  const sanitizedUrl = sanitizeUrlForLog(url);
  const apiSubcategory = getApiSubcategory(url);
  if (apiSubcategory) {
    log.info(`API.${apiSubcategory}`, `${method} ${sanitizedUrl}`);
  } else {
    log.info("HTTP", `${method} ${sanitizedUrl}`);
  }
}

export function logApiResponse(
  method: string,
  url: string,
  status: number,
  duration?: number
): void {
  const sanitizedUrl = sanitizeUrlForLog(url);
  const durationText = duration ? ` (${duration}ms)` : "";
  const apiSubcategory = getApiSubcategory(url);
  if (apiSubcategory) {
    log.info(`API.${apiSubcategory}`, `${method} ${sanitizedUrl} - ${status}${durationText}`);
  } else {
    log.info("HTTP", `${method} ${sanitizedUrl} - ${status}${durationText}`);
  }
}
