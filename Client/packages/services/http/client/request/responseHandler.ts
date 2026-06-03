import { log } from "packages/logger";
import { isAuthEndpoint } from "packages/services/http/client/auth/authRecovery";
import { AuthenticationError, HttpError } from "packages/services/http/client/errors";
import { dateNow } from "packages/utils/date";
import { asError } from "packages/utils/errorHandling/error";
import { getDocument, getWindow } from "packages/utils/platform";

export function handleHttpResponse<T>(
  response: Response,
  responseText: string,
  contentType: string,
  url: string,
  acceptStatuses: number[],
  mergedHeaders: Record<string, string>,
  requestOptions: RequestInit,
  method: string
): T {
  if (!response.ok && !acceptStatuses.includes(response.status)) {
    let parsedBody: unknown;

    try {
      if (contentType.includes("application/json") && responseText.trim()) {
        parsedBody = JSON.parse(responseText);

        if (
          response.status === 401 &&
          parsedBody &&
          typeof parsedBody === "object" &&
          "error" in parsedBody
        ) {
          const authErrorCodes = ["TOKEN_EXPIRED", "INVALID_TOKEN", "UNAUTHORIZED", "NO_TOKEN"];
          const errorBody = parsedBody as {
            error: string;
            message?: string;
          };

          const doc = getDocument();
          const allCookies = doc
            ? doc.cookie
                .split(";")
                .map((c) => c.trim().split("=")[0])
                .filter(Boolean)
            : [];

          const win = getWindow();
          const currentOrigin = win ? win.location.origin : "";
          const apiHost = (() => {
            try {
              return new URL(url).host;
            } catch {
              return "";
            }
          })();
          const originHost = (() => {
            try {
              return win && win.location.host ? new URL(currentOrigin).host : "";
            } catch {
              return "";
            }
          })();
          const isOriginMismatch =
            originHost &&
            apiHost &&
            originHost !== apiHost &&
            /^(127\.0\.0\.1|localhost)$/.test(originHost) &&
            /^(127\.0\.0\.1|localhost)$/.test(apiHost);

          const isExpectedUnauthenticated = isAuthEndpoint(url) && allCookies.length === 0;
          const clientRequestId =
            mergedHeaders["X-Request-ID"] ?? mergedHeaders["x-request-id"] ?? undefined;
          const serverRequestId = response.headers.get("X-Request-ID");
          const logPayload = {
            url,
            errorCode: errorBody.error,
            message: errorBody.message,
            clientRequestId,
            serverRequestId,
            hasCookies: allCookies.length > 0,
            cookies: allCookies,
            requestCredentials: requestOptions.credentials,
            corsOrigin: response.headers.get("access-control-allow-origin"),
            corsCredentials: response.headers.get("access-control-allow-credentials"),
            currentOrigin,
            ...(isOriginMismatch && !allCookies.length
              ? {
                  devHint:
                    "App and API use different hosts (e.g. 127.0.0.1 vs localhost). Open the app at the same host as the API (e.g. http://localhost:5173) and ensure you are logged in.",
                }
              : {}),
          };
          if (isExpectedUnauthenticated) {
            log.debug("HTTP", "Auth endpoint 401 (no session - expected)", logPayload);
          } else {
            log.error("HTTP", "❌ AUTH_ERROR_401", logPayload);
          }

          const credentialsIncluded = requestOptions.credentials === "include";
          const isKnownAuthError =
            authErrorCodes.includes(errorBody.error) ||
            errorBody.error === "ACCESS_TOKEN_MISSING" ||
            errorBody.error === "Authentication required" ||
            errorBody.error === "Unauthorized" ||
            (credentialsIncluded &&
              !isAuthEndpoint(url) &&
              typeof errorBody.error === "string" &&
              errorBody.error.length > 0);
          if (isKnownAuthError) {
            // Auth endpoints (e.g. /api/v1/user/profile during bootstrap): throw HttpError
            // so callers can return { success: false } without triggering global logout/redirect
            if (isAuthEndpoint(url)) {
              throw new HttpError(response.status, url, responseText.slice(0, 600), parsedBody);
            }
            throw new AuthenticationError(
              errorBody.error,
              errorBody.message ?? "Authentication required",
              response.status
            );
          }
        }
      }
    } catch (parseError: unknown) {
      const error = asError(parseError);
      if (error instanceof AuthenticationError) throw error;
    }

    if (response.status === 502) {
      log.error("HTTP", "HTTP_502_BAD_GATEWAY", {
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        responseText: responseText,
        parsedBody: (() => {
          try {
            return contentType.includes("application/json") && responseText.trim()
              ? JSON.parse(responseText)
              : undefined;
          } catch {
            return undefined;
          }
        })(),
        headers: Object.fromEntries(response.headers.entries()),
        requestHeaders: mergedHeaders,
        timestamp: dateNow().toISOString(),
      });
    }

    throw new HttpError(
      response.status,
      url,
      responseText.slice(0, 600),
      (() => {
        try {
          return contentType.includes("application/json") && responseText.trim()
            ? JSON.parse(responseText)
            : undefined;
        } catch {
          return undefined;
        }
      })()
    );
  }

  if (!contentType.includes("application/json")) {
    if (acceptStatuses.includes(response.status) ?? responseText.trim() === "") {
      return undefined as unknown as T;
    }
    throw new Error(
      `Expected JSON from ${url} but got ${contentType ?? "unknown type"}. Body: ${responseText.slice(0, 200)}`
    );
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(`Invalid JSON from ${url}. Body: ${responseText.slice(0, 200)}`);
  }
}
