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
 * Search and isochrone API contracts.
 */

import type { components } from "packages/types/api.generated";

// UI utility type (stays local)
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Re-export from generated schema
export type AreaBoundaryResponse = components["schemas"]["AreaBoundaryResponse"];
export type AreaSearchResult = components["schemas"]["AreaSearchResult"];
export type AreaSuggestionsResponse = components["schemas"]["AreaSuggestionsResponse"];
export type PreferencesResponse = components["schemas"]["PreferencesResponse"];
export type IsochroneGeometry = components["schemas"]["IsochroneGeometry"];
export type UserPreferencesData = components["schemas"]["UserPreferencesData"];
export type ViewportPolygonPoint = components["schemas"]["ViewportPolygonPoint"];
export type SearchByPolygonRequest = components["schemas"]["SearchByPolygonRequest"];
export type SearchByPolygonResponse = components["schemas"]["SearchByPolygonResponse"];

export function isApiResponse<T>(obj: unknown): obj is ApiResponse<T> {
  return (
    typeof obj === "object" && obj !== null && typeof (obj as ApiResponse<T>).success === "boolean"
  );
}
