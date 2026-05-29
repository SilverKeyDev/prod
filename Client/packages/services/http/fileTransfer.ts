import { getEnv } from "packages/config/env";
import { getAuthToken } from "packages/services/http/authToken";
import type { ApiRequestOptions } from "packages/types/domain/api";
import { getFetch } from "packages/utils/platform";

import { apiRequest } from "./apiRequest";
import { HttpError } from "./client/errors";
import { normalizeHeaders, normalizeUrl } from "./client/request/httpRequestHeaders";

const toPlainHeaderObject = normalizeHeaders;
const normalizeBase = normalizeUrl;

export function apiUpload<T = unknown>(
  endpoint: string,
  formData: FormData,
  options: Omit<ApiRequestOptions, "method" | "body"> = {}
): Promise<T> {
  const plain = toPlainHeaderObject(options.headers);
  delete plain["Content-Type"];
  delete plain["content-type"];

  return apiRequest<T>(endpoint, {
    ...options,
    method: "POST",
    headers: plain,
    body: formData,
  });
}

export async function apiDownloadBlob(
  endpoint: string,
  options: Omit<ApiRequestOptions, "method" | "body"> = {}
): Promise<Blob> {
  const {
    includeCredentials = true,
    includeAuth = true,
    authToken,
    timeout = 30000,
    useCors = true,
    baseUrl,
    ...fetchOptions
  } = options;

  const base = normalizeBase(baseUrl ?? getEnv().apiBaseUrl.replace(/\/+$/, ""));
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${base}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const token = authToken ?? (includeAuth ? getAuthToken() : null);
  const headers = {
    ...toPlainHeaderObject(fetchOptions.headers),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, timeout));

  try {
    const res = await getFetch()(url, {
      ...fetchOptions,
      method: "GET",
      headers,
      mode: useCors ? "cors" : fetchOptions.mode,
      credentials: includeCredentials ? "include" : fetchOptions.credentials,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new HttpError(res.status, url, text.slice(0, 600));
    }

    return await res.blob();
  } finally {
    clearTimeout(timer);
  }
}
