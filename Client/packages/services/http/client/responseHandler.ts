import { log, LOG_CATEGORIES } from "logger";

import { dateNow } from "packages/utils/core/date";
import { asError } from "packages/utils/core/errorHandling/error";
import { getDocument, getWindow } from "packages/utils/core/platform";

import { AuthenticationError, HttpError } from "./errors";

export function handleHttpResponse<T>(
  response: Response,
  responseText: string,
  contentType: string,
  url: string,
  acceptStatuses: number[],
  mergedHeaders: Record<string, string>,
  requestOptions: RequestInit,
  method: string,
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
          const authErrorCodes = [
            "TOKEN_EXPIRED",
            "INVALID_TOKEN",
            "UNAUTHORIZED",
            "NO_TOKEN",
          ];
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
          log.error(LOG_CATEGORIES.HTTP, "❌ AUTH_ERROR_401", {
            url,
            errorCode: errorBody.error,
            message: errorBody.message,
            hasCookies: allCookies.length > 0,
            cookies: allCookies,
            requestCredentials: requestOptions.credentials,
            corsOrigin: response.headers.get("access-control-allow-origin"),
            corsCredentials: response.headers.get(
              "access-control-allow-credentials",
            ),
            currentOrigin: win ? win.location.origin : "",
          });

          if (authErrorCodes.includes(errorBody.error)) {
            throw new AuthenticationError(
              errorBody.error,
              errorBody.message ?? "Authentication required",
              response.status,
            );
          }
        }
      }
    } catch (parseError: unknown) {
      const error = asError(parseError);
      if (error instanceof AuthenticationError) throw error;
    }

    if (response.status === 502) {
      log.error(LOG_CATEGORIES.HTTP, "HTTP_502_BAD_GATEWAY", {
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        responseText: responseText,
        parsedBody: (() => {
          try {
            return contentType.includes("application/json") &&
              responseText.trim()
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
      })(),
    );
  }

  if (!contentType.includes("application/json")) {
    if (
      acceptStatuses.includes(response.status) ??
      responseText.trim() === ""
    ) {
      return undefined as unknown as T;
    }
    throw new Error(
      `Expected JSON from ${url} but got ${contentType ?? "unknown type"}. Body: ${responseText.slice(0, 200)}`,
    );
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(
      `Invalid JSON from ${url}. Body: ${responseText.slice(0, 200)}`,
    );
  }
}
