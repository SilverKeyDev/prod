import type { SearchDisplayPayload } from "packages/features/search/types/domain/searchDisplay";
import { apiGet, apiPatch } from "packages/services/http";
import type { components } from "packages/types/api.generated";

// Re-export type from generated schema
export type SearchDisplayResponse = components["schemas"]["SearchDisplayResponse"];

export const searchDisplayApi = {
  get: (): Promise<SearchDisplayResponse> =>
    apiGet<SearchDisplayResponse>("/api/v1/search-display"),

  patch: (partial: Partial<SearchDisplayPayload>): Promise<SearchDisplayResponse> =>
    apiPatch<SearchDisplayResponse>("/api/v1/search-display", partial),
};
