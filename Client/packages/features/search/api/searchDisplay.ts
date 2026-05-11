/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * This file re-exports types from the generated API contract (api.generated.ts).
 * All type definitions have been moved to openapi.yaml.
 *
 * To add/modify API types:
 * 1. Edit openapi.yaml
 * 2. Run `pnpm generate:api-types`
 * 3. Types will be auto-generated in packages/types/api.generated.ts
 *
 * This shim maintains backward compatibility for existing imports.
 */

import type { SearchDisplayPayload } from "packages/features/search/types/domain/searchDisplay";
import { apiGet, apiPatch } from "packages/services/http/compatibility";
import type { components } from "packages/types/api.generated";

// Re-export type from generated schema
export type SearchDisplayResponse = components["schemas"]["SearchDisplayResponse"];

export const searchDisplayApi = {
  get: (): Promise<SearchDisplayResponse> =>
    apiGet<SearchDisplayResponse>("/api/v1/search-display"),

  patch: (partial: Partial<SearchDisplayPayload>): Promise<SearchDisplayResponse> =>
    apiPatch<SearchDisplayResponse>("/api/v1/search-display", partial),
};
