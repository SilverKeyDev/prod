/**
 * HTTP method helpers: apiGet, apiPost, apiPut, apiPatch, apiDelete
 */

import type { ApiRequestOptions } from "packages/schemas/api";

import { apiRequest } from "./core";

export function apiGet<T = unknown>(
  endpoint: string,
  options: Omit<ApiRequestOptions, "method" | "body"> = {},
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: "GET" });
}

export function apiPost<T = unknown>(
  endpoint: string,
  data?: unknown,
  options: Omit<ApiRequestOptions, "method"> = {},
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "POST",
    body: data !== undefined ? JSON.stringify(data) : options.body,
  });
}

export function apiPut<T = unknown>(
  endpoint: string,
  data?: unknown,
  options: Omit<ApiRequestOptions, "method"> = {},
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "PUT",
    body: data !== undefined ? JSON.stringify(data) : options.body,
  });
}

export function apiPatch<T = unknown>(
  endpoint: string,
  data?: unknown,
  options: Omit<ApiRequestOptions, "method"> = {},
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: data !== undefined ? JSON.stringify(data) : options.body,
  });
}

export function apiDelete<T = unknown>(
  endpoint: string,
  data?: unknown,
  options: Omit<ApiRequestOptions, "method"> = {},
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "DELETE",
    body: data !== undefined ? JSON.stringify(data) : options.body,
  });
}
