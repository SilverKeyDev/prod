/**
 * Client error reporting – sends frontend error reports to the backend.
 * Lives in services/security to avoid config → services → config cycles.
 * Uses direct fetch (not the shared HTTP client) to avoid pulling in config/api.
 */

import { getEnv } from "packages/config/env";
import { getFetchIfAvailable } from "packages/utils/platform";

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

/**
 * Report a client error to the backend. Fire-and-forget; does not throw.
 * Caller should not rely on this for control flow.
 */
export async function reportClientError(payload: ClientErrorPayload): Promise<void> {
  if (!payload.message && !payload.name) return;

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
