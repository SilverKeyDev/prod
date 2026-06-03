/**
 * HTTP compatibility layer config and client instance
 */

import { getEnv } from "packages/config/env";
import { log } from "packages/logger";
import { getAuthToken } from "packages/services/http/authToken";
import { HttpClient, type HttpClientConfig } from "packages/services/http/client";

export { getAuthToken };

export type WindowWithEnv = {
  __ENV__?: Record<string, string>;
  getSecureAccessToken?: () => string | null;
  clearSecureTokens?: () => void;
} & Window;

const localHttpConfig: HttpClientConfig = {
  baseUrl: getEnv().apiBaseUrl.replace(/\/+$/, ""),
  timeout: 30000,
  retries: 2,
  authTokenProvider: () => getAuthToken(),
  onAuthError: (error: Error) => {
    log.warn("HTTP", "Auth error in HTTP client", { error });
  },
};

export const httpClient = new HttpClient(localHttpConfig);
