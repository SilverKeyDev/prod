import { getDocument } from "packages/utils/platform";

import { createAuthHeaders, normalizeHeaders, normalizeUrl } from "./utils";

export type HttpClientConfig = {
  baseUrl: string;
  timeout: number;
  authTokenProvider: () => string | null;
};

export type RequestHelpersOptions = {
  timeout?: number;
  baseUrl?: string;
  includeAuth?: boolean;
  authToken?: string | null;
  includeCredentials?: boolean;
  useCors?: boolean;
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  mode?: RequestMode;
} & RequestInit;

export function buildRequestOptions(
  endpoint: string,
  options: RequestHelpersOptions,
  config: HttpClientConfig
): {
  url: string;
  requestOptions: RequestInit;
  method: string;
  mergedHeaders: Record<string, string>;
} {
  const {
    baseUrl,
    includeAuth = true,
    authToken,
    includeCredentials = true,
    useCors = true,
    ...fetchOptions
  } = options;

  const base = normalizeUrl(baseUrl ?? config.baseUrl);
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${base}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const token = authToken ?? (includeAuth ? config.authTokenProvider() : null);
  const authHeaders = includeAuth ? createAuthHeaders(token) : {};
  const mergedHeaders = {
    ...authHeaders,
    ...normalizeHeaders(fetchOptions.headers),
  };

  if (fetchOptions.body instanceof FormData) {
    delete mergedHeaders["Content-Type"];
    delete mergedHeaders["content-type"];
  }

  const requestOptions: RequestInit = {
    ...fetchOptions,
    headers: mergedHeaders,
    mode: useCors ? "cors" : (fetchOptions.mode ?? "same-origin"),
    credentials: includeCredentials ? "include" : (fetchOptions.credentials ?? "same-origin"),
  };

  try {
    const methodUpper = (requestOptions.method ?? "GET").toUpperCase();
    const isStateChanging = /^(POST|PUT|PATCH|DELETE)$/.test(methodUpper);
    const doc = getDocument();
    const csrf = doc
      ? (doc.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content
      : undefined;
    if (isStateChanging && csrf) {
      (requestOptions.headers as Record<string, string>)["X-CSRF-Token"] = csrf;
    }
  } catch {
    /* best-effort */
  }

  const method = (requestOptions.method ?? "GET").toUpperCase();
  return { url, requestOptions, method, mergedHeaders };
}
