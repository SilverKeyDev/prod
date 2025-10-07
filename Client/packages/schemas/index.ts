// Central export file for all types

// API types
export * from "./api";

// Billing types
export * from "./billing";

// Chat types
export * from "./chat";

// Document types
export * from "./documents";

// Offer types
export * from "./offers";

// Property types
export * from "./property";

// Report types
export * from "./reports";

// Search types (with explicit exports to avoid conflicts)
export type {
  PreferencesResponse,
  IsochroneApiResponse,
  MapPosition,
  MapBounds,
  MapMarker,
  MapPolygon,
  PropertyImage,
  PropertyDetails,
  PropertyType,
  ListingStatus,
  SearchMetadata,
  SearchData,
  SearchFilters,
  UseSearchBootstrapParams,
  UseIsochroneFlowParams,
  SearchEventHandlers,
  SearchLayoutProps,
  MapContainerProps,
  SearchError,
  ErrorBoundaryState,
  DeepPartial,
  RequiredFields,
  OptionalFields,
  SearchResult,
} from "./search";

// Re-export search utility functions
export {
  isPropertyDetails,
  isApiResponse as isSearchApiResponse,
  isMapPosition,
  getMatchScore,
} from "./search";

// User types
export * from "./user";

// Metrics types
export * from "./metrics";

// Plaid types (with explicit exports to avoid conflicts)
export type {
  PlaidItem,
  PlaidAssetReport,
  PlaidStatement,
  PlaidLinkToken,
  PlaidAssetReportData,
  CreateLinkTokenRequest,
  ExchangeTokenRequest,
  CreateAssetReportRequest,
} from "./plaid";

// Checklists
export * from "./checklists";
