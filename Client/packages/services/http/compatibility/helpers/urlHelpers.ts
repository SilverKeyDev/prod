/**
 * URL construction helpers
 */

import { getEnv } from "packages/config/env";
import { normalizeUrl } from "packages/services/http/client";

export type QueryValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | (string | number | boolean)[];

const normalizeBase = normalizeUrl;

export function buildApiUrl(
  endpoint: string,
  params: Record<string, QueryValue> = {},
  baseUrl?: string
): string {
  const base = normalizeBase(baseUrl ?? getEnv().apiBaseUrl.replace(/\/+$/, ""));
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${base}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

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
