// Public API for search feature – components and hooks used by pages/layouts

export { ConnectedCardHeartSave } from "./components/ConnectedCardHeartSave";
export { SearchNavLink } from "./components/header/SearchNavLink";
export { SearchPageMapView } from "./components/layout/SearchPageMapView";
export { SearchPageModals } from "./components/layout/SearchPageModals";
export { DesktopReelsView } from "./components/reels/DesktopReelsView";
export { SearchFeature } from "./components/src/SearchFeature";
export { useSavedHomesData } from "./hooks/data/saved/useSavedHomesData";
export { useSavedHomesStoreIntegration } from "./hooks/store/useSavedHomesStoreIntegration";
export type { AutocompleteSuggestion, GoogleMapsWindow } from "./types/google-maps";
export type { Property, SavedHome } from "./types/property";
export type { PropertyWithAnalysis } from "./types/property";
export type { SearchResult } from "./types/result";
export {
  formatAgentName,
  formatFilenameToAddress,
  formatLotSize,
  formatStructuredAddress,
} from "./types/search/address";
export type { AddressObject } from "./types/search/propertyDetailsFormatters";
export { formatPrice } from "./types/search/propertyDetailsFormatters";
export { formatAddress, getPropertyImages } from "./types/search/propertyDetailsFormatters";
export { formatPropertyType } from "./types/search/propertyFormatters";
export { SEARCH_TRANSLATIONS } from "./types/translations";
