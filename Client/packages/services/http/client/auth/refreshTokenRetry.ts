import { getEnv } from "packages/config/env";
import { log } from "packages/logger";
import { normalizeUrl } from "packages/services/http/client/request/httpRequestHeaders";
import { createHttpRequestId } from "packages/services/http/client/request/requestId";
import { getFetch } from "packages/utils/platform";

export type RefreshTokenAttemptResult = {
  ok: boolean;
  success: boolean;
  status: number;
  retryable: boolean;
  body: Record<string, unknown> | null;
};

const REFRESH_BACKOFF_MS = [500, 1000] as const;

function parseRefreshBody(text: string): Record<string, unknown> | null {
  if (!text.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function isRetryableRefreshResponse(status: number, body: Record<string, unknown> | null): boolean {
  if (status === 503) return true;
  if (body?.retryable === true) return true;
  return false;
}

function refreshUrl(): string {
  const configuredBase = normalizeUrl(getEnv().apiBaseUrl.replace(/\/+$/, ""));
  const path = "/api/v1/auth/refresh-token";
  return path.startsWith("http") || configuredBase === "" ? path : `${configuredBase}${path}`;
}

/**
 * POST refresh-token with backoff on transient 503 / retryable failures.
 */
export async function postRefreshTokenWithRetry(
  maxAttempts = 3,
  correlationId = createHttpRequestId()
): Promise<RefreshTokenAttemptResult> {
  const url = refreshUrl();
  const doFetch = getFetch();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await doFetch(url, {
        credentials: "include",
        method: "POST",
        headers: { "X-Request-ID": correlationId },
      });
      const text = await response.text();
      const body = parseRefreshBody(text);
      const success = response.ok && body?.success === true;

      if (success) {
        return { ok: true, success: true, status: response.status, retryable: false, body };
      }

      const retryable = isRetryableRefreshResponse(response.status, body);
      if (retryable && attempt < maxAttempts) {
        const delay = REFRESH_BACKOFF_MS[attempt - 1] ?? 1000;
        log.warn("AUTH", "Refresh-token transient failure; retrying", {
          correlationId,
          attempt,
          status: response.status,
          delayMs: delay,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return {
        ok: response.ok,
        success: false,
        status: response.status,
        retryable,
        body,
      };
    } catch (error) {
      if (attempt < maxAttempts) {
        const delay = REFRESH_BACKOFF_MS[attempt - 1] ?? 1000;
        log.warn("AUTH", "Refresh-token request threw; retrying", {
          correlationId,
          attempt,
          delayMs: delay,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      log.warn("AUTH", "Refresh-token request failed after retries", {
        correlationId,
        error: error instanceof Error ? error.message : "unknown",
      });
      return { ok: false, success: false, status: 0, retryable: true, body: null };
    }
  }

  return { ok: false, success: false, status: 0, retryable: false, body: null };
}

export function isTransientRefreshFailure(result: RefreshTokenAttemptResult): boolean {
  return !result.success && result.retryable;
}
