/**
 * Legacy compatibility
 */

import { apiRequest } from "./core/core";

/** @deprecated Use apiRequest/apiGet/apiPost/etc. instead */
export function legacyApiRequest(url: string, options: RequestInit = {}): Promise<unknown> {
  return apiRequest(url, options);
}
