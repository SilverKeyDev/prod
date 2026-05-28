/**
 * Hook and layout parameter types for search (bootstrap, isochrone flow, layout props).
 */

import type { IsochroneData } from "../isochrone";
import type { ListingStatus, PropertyDetails, PropertyType } from "./result";

export type SearchMetadata = {
  hasSearched: boolean;
  currentPage: number;
  propertiesPerPage: number;
  timestamp?: string;
  totalCount?: number;
};

export type SearchData = {
  results: PropertyDetails[];
  timestamp: string;
  totalCount: number;
  preferencesVersion: string;
  searchMetadata: SearchMetadata;
};

export type SearchFilters = {
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minSqft?: number;
  maxSqft?: number;
  propertyTypes?: PropertyType[];
  listingStatus?: ListingStatus[];
};

export type UseSearchBootstrapParams = {
  env: { apiBaseUrl: string };
  setSearchResults: (results: PropertyDetails[]) => void;
  setHasSearched: (searched: boolean) => void;
  setCurrentPage: (page: number) => void;
  setShowPropertyModals: (show: boolean) => void;
};

export type UseIsochroneFlowParams = {
  env: { apiBaseUrl: string };
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  renderIsochronePolygon: (data: IsochroneData) => void;
  renderImportantLocationMarkers: (data: IsochroneData) => Promise<void>;
  searchPropertiesInIsochrone: (
    isochroneData: IsochroneData,
    setSearchStage: (stage?: string) => void,
    setSearchResults: (results: PropertyDetails[]) => void,
    setIsSearching: (searching: boolean) => void,
    setHasSearched: (searched: boolean) => void,
    setCurrentPage: (page: number) => void,
    setShowPropertyModals: (show: boolean) => void
  ) => Promise<void>;
  setSearchStage: (stage?: string) => void;
  setSearchResults: (results: PropertyDetails[]) => void;
  setIsSearching: (searching: boolean) => void;
  setHasSearched: (searched: boolean) => void;
  setCurrentPage: (page: number) => void;
  setShowPropertyModals: (show: boolean) => void;
  mapFocusOnCurrentProperty: () => void;
};

export type SearchEventHandlers = {
  onViewPropertyDetails: (property: PropertyDetails) => void;
  onSearch: () => void;
  onTabChange: (tab: "results" | "saved") => void;
  onPageChange: (page: number) => void;
  onSaveHome: (property: PropertyDetails) => void;
  onRemoveSavedHome: (propertyId: string) => void;
  onUpdatePreferences?: () => void;
  onToggleCarousel?: () => void;
};

export type SearchLayoutProps = {
  searchResults: PropertyDetails[];
  savedHomes: PropertyDetails[];
  activeTab: "results" | "saved";
  currentPage: number;
  hasSearched: boolean;
  isSearching: boolean;
  searchStage?: string;
  showPropertyModals: boolean;
  isLocalStorageLoaded: boolean;
  perPage?: number;
  isHomeSaved: (id: string) => boolean;
  mobileMapRef: React.RefObject<HTMLDivElement>;
  desktopMapRef: React.RefObject<HTMLDivElement>;
};

export type MapContainerProps = {
  isMobile?: boolean;
  isCarouselCollapsed?: boolean;
  selectedProperty?: PropertyDetails;
  isLoadingPropertyDetails?: boolean;
} & SearchLayoutProps;

export type SearchError = {
  message: string;
  code?: string;
  context?: string;
  timestamp: string;
  stack?: string;
};

export type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
