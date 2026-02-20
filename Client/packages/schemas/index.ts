// Central export file for all types

// API types
export * from "./api";

// Agent types (dashboard, alerts, todos, etc.)
export * from "./agent/agent";

// Billing types
export * from "./finance/billing";

// Chat types
export * from "./integrations/chat";

// Feed types
export * from "./content/feed/feed";

// Document types
export * from "./content/documents/documents";
export * from "./content/documents/docusign";
export * from "./content/documents/types";

// Offer types
export * from "./finance/offers";

// Property types
export * from "./search/property";

// Report types
export * from "./content/documents/reports";

// Search types (with explicit exports to avoid conflicts)
export type {
  DeepPartial,
  ErrorBoundaryState,
  IsochroneApiResponse,
  ListingStatus,
  MapBounds,
  MapContainerProps,
  MapMarker,
  MapPolygon,
  MapPosition,
  OptionalFields,
  PreferencesResponse,
  PropertyDetails,
  PropertyImage,
  PropertyType,
  RequiredFields,
  SearchData,
  SearchError,
  SearchEventHandlers,
  SearchFilters,
  SearchLayoutProps,
  SearchMetadata,
  SearchResult,
  UseIsochroneFlowParams,
  UseSearchBootstrapParams,
} from "./search/search";

// Re-export search utility functions
export {
  getMatchScore,
  isMapPosition,
  isPropertyDetails,
  isApiResponse as isSearchApiResponse,
} from "./search/search";

// User types
export * from "./app/auth/user";

// Metrics types
export * from "./finance/metrics";

// Plaid types (with explicit exports to avoid conflicts)
export type {
  CreateAssetReportRequest,
  CreateLinkTokenRequest,
  ExchangeTokenRequest,
  PlaidAssetReport,
  PlaidAssetReportData,
  PlaidItem,
  PlaidLinkToken,
  PlaidStatement,
} from "./plaid";

// Checklists
export * from "./integrations/checklists";

// Calendar types
export * from "./calendar/calendar";

// UI (breakpoints, responsive helpers, button styles, icon names)
export * from "./app/ui/button";
export * from "./app/ui/icons";
export * from "./app/ui/screens";
