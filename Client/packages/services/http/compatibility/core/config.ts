/**
 * HTTP compatibility layer config and client instance
 */

import { getEnv } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";
import { HttpClient, type HttpClientConfig } from "packages/services/http/client";

export type WindowWithEnv = {
  __ENV__?: Record<string, string>;
  getSecureAccessToken?: () => string | null;
  clearSecureTokens?: () => void;
} & Window;

export function getAuthToken(): string | null {
  // With HTTP-only cookies, tokens are never accessible to JavaScript
  return null;
}

const localHttpConfig: HttpClientConfig = {
  baseUrl: getEnv().apiBaseUrl.replace(/\/+$/, ""),
  timeout: 30000,
  retries: 2,
  authTokenProvider: () => getAuthToken(),
  onAuthError: (error: Error) => {
    log.warn(LOG_CATEGORIES.HTTP, "Auth error in HTTP client", { error });
  },
};

export const httpClient = new HttpClient(localHttpConfig);
