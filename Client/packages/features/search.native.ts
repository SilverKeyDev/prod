/**
 * Native barrel for the search feature. Used by Metro when resolving
 * "packages/features/search" on ios/android. ConnectedCardHeartSave is now
 * consolidated and uses platform-resolved HeartSave components.
 */
export { ConnectedCardHeartSave } from "./search/components/ConnectedCardHeartSave";
export { SearchNavLink } from "./search/components/header/SearchNavLink";
export { SearchPageMapView } from "./search/components/layout/SearchPageMapView";
export { SearchPageModals } from "./search/components/layout/SearchPageModals";
export { DesktopReelsView } from "./search/components/reels/DesktopReelsView";
export { SearchFeature } from "./search/components/src/SearchFeature";
export { usePropertyDetails } from "./search/hooks/data/property/usePropertyDetails";
export type { Property, SavedHome } from "./search/types/property";
export type { PropertyWithAnalysis } from "./search/types/property";
export type { SearchResult } from "./search/types/result";
export {
  formatAgentName,
  formatFilenameToAddress,
  formatLotSize,
  formatStructuredAddress,
} from "./search/types/search/formatters/address";
export type { AddressObject } from "./search/types/search/formatters/propertyDetailsFormatters";
export { formatPrice } from "./search/types/search/formatters/propertyDetailsFormatters";
export {
  formatAddress,
  getPropertyImages,
} from "./search/types/search/formatters/propertyDetailsFormatters";
export { formatPropertyType } from "./search/types/search/formatters/propertyFormatters";
export { SEARCH_TRANSLATIONS } from "./search/types/translations";
export { useSavedHomesData } from "packages/hooks/data/saved/useSavedHomesData";
export { useSavedHomesStoreIntegration } from "packages/hooks/store";
export type {
  AutocompleteSuggestion,
  GoogleMapsWindow,
} from "packages/types/integrations/google-maps";
