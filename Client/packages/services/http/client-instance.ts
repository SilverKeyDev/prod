/* =========================
   HTTP Client Instance
   ========================= */

import { getBaseUrl, getDefaultRetries, getDefaultTimeout } from "packages/config";
import { log, LOG_CATEGORIES } from "packages/logger";
import { getAuthToken } from "packages/utils";

import { HttpClient, type HttpClientConfig } from "./client";

/* =========================
   Environment Configuration
   ========================= */

// Use imported functions directly

/* =========================
   Auth Token Provider
   ========================= */

function createAuthTokenProvider(): () => string | null {
  return () => {
    try {
      return getAuthToken();
    } catch (error: unknown) {
      log.warn(LOG_CATEGORIES.HTTP, "Failed to get auth token", error);
      return null;
    }
  };
}

/* =========================
   Auth Error Handler
   ========================= */

function createAuthErrorHandler(): (error: Error) => void {
  return (error: Error) => {
    log.warn(LOG_CATEGORIES.AUTH, "Auth error in HTTP client", error);
    // Note: Removed authChange dispatch to prevent conflicts
  };
}

/* =========================
   Default Configuration
   ========================= */

export const defaultHttpConfig: HttpClientConfig = {
  baseUrl: getBaseUrl(),
  timeout: getDefaultTimeout(),
  retries: getDefaultRetries(),
  authTokenProvider: createAuthTokenProvider(),
  onAuthError: createAuthErrorHandler(),
};

/* =========================
   Configured HTTP Client
   ========================= */

export const httpClient = new HttpClient(defaultHttpConfig);

/* =========================
   Configuration Utilities
   ========================= */

export function configureHttpClient(config: Partial<HttpClientConfig>): void {
  if (config.baseUrl) httpClient.setBaseUrl(config.baseUrl);
  if (config.timeout) httpClient.setTimeout(config.timeout);
  if (config.authTokenProvider) httpClient.setAuthTokenProvider(config.authTokenProvider);
  if (config.onAuthError) httpClient.setAuthErrorHandler(config.onAuthError);
}
