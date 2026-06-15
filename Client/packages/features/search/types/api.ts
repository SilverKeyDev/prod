import type { components } from "packages/types/api.generated";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

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
