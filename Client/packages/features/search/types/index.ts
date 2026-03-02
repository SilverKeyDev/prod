/**
 * Search feature types and utilities.
 * Single barrel; re-exports from domain modules (api, map, result, property, isochrone, hooksParams).
 */

export type {
  ApiResponse,
  IsochroneGeometry,
  PreferencesResponse,
  SearchByPolygonRequest,
  SearchByPolygonResponse,
  UserPreferencesData,
} from "./api";
export { isApiResponse } from "./api";
export type {
  DeepPartial,
  ErrorBoundaryState,
  MapContainerProps,
  OptionalFields,
  RequiredFields,
  SearchData,
  SearchError,
  SearchEventHandlers,
  SearchFilters,
  SearchLayoutProps,
  SearchMetadata,
  UseIsochroneFlowParams,
  UseSearchBootstrapParams,
} from "./hooksParams";
export type { IsochroneApiResponse, IsochroneData } from "./isochrone";
export type { MapBounds, MapMarker, MapPolygon, MapPosition } from "./map";
export { isMapPosition } from "./map";
export type {
  HomeUniversal,
  Property,
  PropertyAnalysis,
  PropertySearchResult,
  PropertyWithAnalysis,
  SavedHome,
} from "./property";
export type {
  ListingStatus,
  PropertyDetails,
  PropertyImage,
  PropertyType,
  SearchResult,
} from "./result";
export { getMatchScore, isPropertyDetails } from "./result";
export { SEARCH_TRANSLATIONS } from "./translations";
