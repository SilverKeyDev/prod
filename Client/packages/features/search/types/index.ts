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
} from "./domain/hooksParams";
export type {
  HomeUniversal,
  Property,
  PropertyAnalysis,
  PropertyConItem,
  PropertyProItem,
  PropertySearchResult,
  PropertyWithAnalysis,
  SavedHome,
} from "./domain/property";
export type {
  ListingStatus,
  PropertyDetails,
  PropertyImage,
  PropertyType,
  SearchResult,
} from "./domain/result";
export { getMatchScore, isListingFullCriteriaMatch, isPropertyDetails } from "./domain/result";
export { SEARCH_TRANSLATIONS } from "./domain/translations";
export type { IsochroneApiResponse, IsochroneData } from "./isochrone";
export type { MapBounds, MapMarker, MapPolygon, MapPosition } from "./map";
export { isMapPosition } from "./map";
export {
  SEARCH_HEADER_FILTER_GAP_PX,
  SEARCH_HEADER_FILTER_PROMOTION_ORDER,
  type SearchHeaderFilterId,
} from "./searchHeaderFilter";
