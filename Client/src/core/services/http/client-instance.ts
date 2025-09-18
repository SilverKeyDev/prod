/* =========================
   HTTP Client Instance
   ========================= */

import { env } from '../../config';
import { getAuthToken } from '../../utils/auth';

import { HttpClient, type HttpClientConfig } from './client';

/* =========================
   Environment Configuration
   ========================= */

function getBaseUrl(): string {
  return env.apiBaseUrl;
}

function getDefaultTimeout(): number {
  return env.apiTimeout;
}

function getDefaultRetries(): number {
  return env.apiRetries;
}

/* =========================
   Auth Token Provider
   ========================= */

function createAuthTokenProvider(): () => string | null {
  return () => {
    try {
      return getAuthToken();
    } catch (error: unknown) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  };
}

/* =========================
   Auth Error Handler
   ========================= */

function createAuthErrorHandler(): (error: Error) => void {
  return (error: Error) => {
    console.warn('Auth error in HTTP client:', error);
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
