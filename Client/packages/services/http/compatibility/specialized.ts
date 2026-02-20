/**
 * Specialized API helpers: apiGetOptional, apiAuthRequired, apiPoll
 */

import type { ApiRequestOptions } from "packages/schemas/api";
import { AuthenticationError, HttpError } from "packages/services/http/client";

import { getAuthToken } from "./core/config";
import { apiRequest } from "./core/core";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function apiGetOptional<T = unknown>(
  endpoint: string,
  options: Omit<ApiRequestOptions, "method" | "body" | "acceptStatuses"> = {},
): Promise<T | null> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: "GET",
    acceptStatuses: [404],
  }).catch((error) => {
    if (error instanceof HttpError && error.status === 404) {
      return null;
    }
    throw error;
  });
}

export async function apiAuthRequired<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    throw new AuthenticationError("NO_TOKEN", "Authentication required", 401);
  }
  return apiRequest<T>(endpoint, {
    ...options,
    includeAuth: true,
    authToken: token,
  });
}

export async function apiPoll<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions & {
    maxAttempts?: number;
    intervalMs?: number;
    condition?: (response: T) => boolean;
  } = {},
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
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) throw error;
      if (attempt === maxAttempts) throw error;
      await sleep(intervalMs);
    }
  }

  throw new Error(`Polling failed after ${maxAttempts} attempts`);
}
