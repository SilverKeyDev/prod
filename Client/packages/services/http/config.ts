/* =========================
   HTTP Client Configuration
   ========================= */

import { log, LOG_CATEGORIES } from "logger";

import {
  getBaseUrl,
  getDefaultRetries,
  getDefaultTimeout,
} from "packages/config";
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

function createAuthErrorHandler() {
  return (error: unknown) => {
    // Use existing handleAuthenticationError - it's already imported in client.ts
    // This handler is only used as a fallback, the main handling is in client.ts
    log.warn(
      LOG_CATEGORIES.HTTP,
      "Auth error handler called as fallback",
      error,
    );
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
  if (config.authTokenProvider)
    httpClient.setAuthTokenProvider(config.authTokenProvider);
  if (config.onAuthError) httpClient.setAuthErrorHandler(config.onAuthError);
}

export function getHttpClientConfig(): HttpClientConfig {
  return { ...defaultHttpConfig };
}
