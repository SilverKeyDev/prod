/**
 * Unified API types barrel for path alias `packages/types/domain/api`.
 * Merges HTTP client types and search/isochrone contracts.
 */
export type {
  ApiRequestOptions,
  ApiResponse,
  FetchJsonOpts,
  RetryOpts,
} from "packages/api/types/api";
export type {
  AreaBoundaryResponse,
  AreaSearchResult,
  AreaSuggestionsResponse,
  IsochroneGeometry,
  PreferencesResponse,
  SearchByPolygonRequest,
  SearchByPolygonResponse,
  UserPreferencesData,
  ViewportPolygonPoint,
} from "packages/features/search/types/api";
export type { IsochroneData } from "packages/features/search/types/isochrone";
export type { PropertySearchResult } from "packages/features/search/types/property";
