/**
 * Client error reporting – sends frontend error reports to the backend.
 * Lives in services/security to avoid config → services → config cycles.
 * Uses direct fetch (not the shared HTTP client) to avoid pulling in config/api.
 */

import { getEnv } from "packages/config/env";
import { getFetchIfAvailable } from "packages/utils/core/platform";

export type ClientErrorPayload = {
  message?: string;
  name?: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  type?: string;
  sessionId?: string;
  environment?: string;
  buildVersion?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  errorBoundary?: boolean;
  routeError?: boolean;
};

// Rate limiting to prevent error cascade
const errorReportQueue = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REPORTS_PER_WINDOW = 10;

/**
 * Report a client error to the backend. Fire-and-forget; does not throw.
 * Caller should not rely on this for control flow.
 * Rate limited to prevent error cascades.
 */
export async function reportClientError(payload: ClientErrorPayload): Promise<void> {
  if (!payload.message && !payload.name) return;

  // Rate limiting check
  const now = Date.now();
  const errorKey = `${payload.name || "unknown"}:${payload.message?.substring(0, 50) || "unknown"}`;
  const lastReported = errorReportQueue.get(errorKey);

  if (lastReported && now - lastReported < RATE_LIMIT_WINDOW) {
    return; // Skip this report to prevent spam
  }

  // Clean old entries
  if (errorReportQueue.size > MAX_REPORTS_PER_WINDOW) {
    const cutoff = now - RATE_LIMIT_WINDOW;
    for (const [key, timestamp] of errorReportQueue.entries()) {
      if (timestamp < cutoff) {
        errorReportQueue.delete(key);
      }
    }
  }

  errorReportQueue.set(errorKey, now);

  const fetchFn = getFetchIfAvailable();
  if (!fetchFn) return;

  try {
    const base = getEnv().apiBaseUrl.replace(/\/+$/, "");
    const url = base ? `${base}/api/v1/client/errors` : "/api/v1/client/errors";
    await fetchFn(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
  } catch {
    // Intentionally swallow: avoid breaking app when reporting fails
  }
}

export const clientErrorsApi = {
  reportClientError,
};
