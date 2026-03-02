// API-related type definitions (core request/response and config)
import { getEnv } from "packages/config/env";

export type ApiSuccess<T> = {
  success: true;
  [k: string]: unknown;
  data?: T;
};

export type ApiError = {
  success: false;
  error?: string;
  [k: string]: unknown;
};

export type FetchJsonOpts = RequestInit & {
  acceptStatuses?: number[];
  timeout?: number;
};

export type RetryOpts = {
  retries?: number;
  retryOnStatuses?: number[];
  retryDelayMs?: number;
  backoffFactor?: number;
  jitter?: boolean;
};

export type ApiRequestOptions = {
  includeCredentials?: boolean;
  includeAuth?: boolean;
  authToken?: string;
  acceptStatuses?: number[];
  timeout?: number;
  useCors?: boolean;
  baseUrl?: string;
} & RequestInit &
  RetryOpts;

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// API Configuration
// In development: empty string uses Vite proxy
// In production: full URL to production backend
export const BASE_URL = getEnv().apiBaseUrl;
