/* =========================
   HTTP Method Helpers & Specialized API Functions
   ========================= */

import { apiRequest, ApiRequestOptions, ApiResponse } from './fetch';
import { getAuthToken } from './auth';
import { AuthenticationError, HttpError } from './errors';

/* =========================
   HTTP Method Helpers
   ========================= */

export function apiGet<T = any>(
  endpoint: string,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

export function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options: Omit<ApiRequestOptions, 'method'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data !== undefined ? JSON.stringify(data) : options.body,
  });
}

export function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options: Omit<ApiRequestOptions, 'method'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data !== undefined ? JSON.stringify(data) : options.body,
  });
}

export function apiPatch<T = any>(
  endpoint: string,
  data?: any,
  options: Omit<ApiRequestOptions, 'method'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data !== undefined ? JSON.stringify(data) : options.body,
  });
}

export function apiDelete<T = any>(
  endpoint: string,
  data?: any,
  options: Omit<ApiRequestOptions, 'method'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'DELETE',
    body: data !== undefined ? JSON.stringify(data) : options.body,
  });
}

/* =========================
   File Upload / Download
   ========================= */

function toPlainHeaderObject(h?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  if (!h) return out;
  if (h instanceof Headers) {
    h.forEach((v, k) => (out[k] = v));
  } else if (Array.isArray(h)) {
    for (const [k, v] of h) out[k] = v;
  } else {
    Object.assign(out, h as Record<string, string>);
  }
  return out;
}

const normalizeBase = (s: string) => s.replace(/\/+$/, '');

const getBaseUrl = (): string => {
  const env = import.meta.env.VITE_API_BASE_URL;
  return normalizeBase(env || '');
};

export function apiUpload<T = any>(
  endpoint: string,
  formData: FormData,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
): Promise<T> {
  const plain = toPlainHeaderObject(options.headers);
  // Ensure browser sets proper multipart boundary
  delete plain['Content-Type'];

  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    headers: plain,
    body: formData,
  });
}

/**
 * Download helper that returns a Blob (for files) while preserving auth/credentials.
 */
export async function apiDownloadBlob(
  endpoint: string,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
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

  const base = normalizeBase(baseUrl || getBaseUrl());
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const token = authToken ?? (includeAuth ? getAuthToken() : null);
  const headers = {
    ...toPlainHeaderObject(fetchOptions.headers),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Do NOT force JSON headers here
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, timeout));

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      method: 'GET',
      headers,
      mode: useCors ? 'cors' : fetchOptions.mode,
      credentials: includeCredentials ? 'include' : fetchOptions.credentials,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new HttpError(res.status, url, text.slice(0, 600));
    }

    return await res.blob();
  } finally {
    clearTimeout(timer);
  }
}

/* =========================
   Specialized API Helpers
   ========================= */

export function apiGetOptional<T = any>(
  endpoint: string,
  options: Omit<ApiRequestOptions, 'method' | 'body' | 'acceptStatuses'> = {}
): Promise<T | null> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'GET',
    acceptStatuses: [404],
  }).catch((error) => {
    if (error instanceof HttpError && error.status === 404) {
      return null;
    }
    throw error;
  });
}

export function apiAuthRequired<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    throw new AuthenticationError('NO_TOKEN', 'Authentication required', 401);
  }
  return apiRequest<T>(endpoint, { ...options, includeAuth: true, authToken: token });
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function apiPoll<T = any>(
  endpoint: string,
  options: ApiRequestOptions & {
    maxAttempts?: number;
    intervalMs?: number;
    condition?: (response: T) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 10,
    intervalMs = 1000,
    condition = () => true,
    ...requestOptions
  } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await apiRequest<T>(endpoint, requestOptions);
      if (condition(response)) return response;
      if (attempt < maxAttempts) await sleep(intervalMs);
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      if (attempt === maxAttempts) throw error;
      await sleep(intervalMs);
    }
  }

  throw new Error(`Polling failed after ${maxAttempts} attempts`);
}

/* =========================
   URL Construction Helpers
   ========================= */

type QueryValue = string | number | boolean | undefined | null | (string | number | boolean)[];

export function buildApiUrl(
  endpoint: string,
  params: Record<string, QueryValue> = {},
  baseUrl?: string
): string {
  const base = normalizeBase(baseUrl || getBaseUrl());
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) search.append(key, String(v));
    } else {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

/* =========================
   Response Type Helpers
   ========================= */

export function isApiResponse<T>(response: any): response is ApiResponse<T> {
  return typeof response === 'object' && response !== null && typeof response.success === 'boolean';
}

export function extractApiData<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error || response.message || 'API request failed');
  }
  return response.data as T;
}

/* =========================
   Legacy Compatibility
   ========================= */

/** @deprecated Use apiRequest/apiGet/apiPost/etc. instead */
export function legacyApiRequest(url: string, options: RequestInit = {}): Promise<any> {
  return apiRequest(url, options);
}
