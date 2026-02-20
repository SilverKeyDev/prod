/**
 * Comprehensive type definitions for search functionality
 * Consolidates all search-related types in one place
 */

// API Response Types
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PreferencesResponse = {
  preferences: {
    preferences_version: string;
    [key: string]: unknown;
  };
};

export type IsochroneApiResponse = {
  success: boolean;
  data: IsochroneData | null;
  error?: string;
};

// Map-related types
export type MapPosition = {
  lat: number;
  lng: number;
};

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapMarker = {
  id: string;
  position: MapPosition;
  title: string;
  content: HTMLElement;
  overlay?: google.maps.OverlayView;
};

export type MapPolygon = {
  id: string;
  paths: MapPosition[][];
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
  map?: google.maps.Map;
  polygon?: google.maps.Polygon;
};

// Property-related types
export type PropertyImage = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type PropertyDetails = {
  id: string;
  address: string;
  price: string | number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
  lotSize?: string;
  propertyType: PropertyType;
  listingStatus: ListingStatus;
  imageUrl?: string;
  images?: PropertyImage[];
  calculatedScore?: number;
  _score?: number;
};

export type PropertyType =
  | "SINGLE_FAMILY"
  | "CONDO"
  | "TOWNHOUSE"
  | "MULTI_FAMILY"
  | "LAND"
  | "COMMERCIAL";

export type ListingStatus =
  | "FOR_SALE"
  | "FOR_RENT"
  | "SOLD"
  | "PENDING"
  | "OFF_MARKET";

// Search-related types
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

// Hook parameter types
export type UseSearchBootstrapParams = {
  /** @deprecated Use preferencesApi.get() via useSearchBootstrap; no longer needed for bootstrap */
  env?: { apiBaseUrl: string };
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
    setShowPropertyModals: (show: boolean) => void,
  ) => Promise<void>;
  setSearchStage: (stage?: string) => void;
  setSearchResults: (results: PropertyDetails[]) => void;
  setIsSearching: (searching: boolean) => void;
  setHasSearched: (searched: boolean) => void;
  setCurrentPage: (page: number) => void;
  setShowPropertyModals: (show: boolean) => void;
  mapFocusOnCurrentProperty: () => void;
};

// Event handler types
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

// Component prop types
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

// Error types
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

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// Type guards
export function isPropertyDetails(obj: unknown): obj is PropertyDetails {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as PropertyDetails).id === "string" &&
    typeof (obj as PropertyDetails).address === "string" &&
    typeof (obj as PropertyDetails).lat === "number" &&
    typeof (obj as PropertyDetails).lng === "number"
  );
}

export function isApiResponse<T>(obj: unknown): obj is ApiResponse<T> {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as ApiResponse<T>).success === "boolean"
  );
}

export function isMapPosition(obj: unknown): obj is MapPosition {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as MapPosition).lat === "number" &&
    typeof (obj as MapPosition).lng === "number"
  );
}

// Shared SearchResult type definition for consistent usage across the application
export type SearchResult = {
  id: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
  lotSize?: string;
  propertyType?: string;
  listingStatus?: string;
  imageUrl?: string;
  _score?: number; // Backend ML match score (0-100 integer)

  // Enhanced property details from searchAddress API
  zpid?: number;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  yearBuilt?: number;
  livingArea?: string;
  livingAreaValue?: number;
  pricePerSquareFoot?: number;
  propertyTypeDimension?: string;
  homeType?: string;
  homeStatus?: string;
  onMarketDate?: number;

  // Financial information
  zestimate?: number;
  taxAnnualAmount?: number;
  propertyTaxRate?: number;
  hoaFee?: string;
  associationFee?: string;
  monthlyHoaFee?: number;
  annualHomeownersInsurance?: number;
  rentZestimate?: number;

  // Property features
  architecturalStyle?: string;
  structureType?: string;
  propertyCondition?: string;
  isNewConstruction?: boolean;
  hasGarage?: boolean;
  hasAttachedGarage?: boolean;
  garageSpaces?: number;
  parking?: number;
  hasView?: boolean;
  waterView?: string;
  hasFireplace?: boolean;
  hasCooling?: boolean;
  hasHeating?: boolean;
  hasAssociation?: boolean;

  // Detailed features
  view?: string[];
  flooring?: string[];
  heating?: string[];
  cooling?: string[];
  appliances?: string[];
  interiorFeatures?: string[];
  exteriorFeatures?: unknown;
  lotFeatures?: string[];
  communityFeatures?: string[];
  parkingFeatures?: string[];
  utilities?: string[];
  inclusions?: string[];

  // Room information
  rooms?: unknown[];
  bathroomsFull?: number;
  bathroomsHalf?: number;
  bathroomsPartial?: number;
  bathroomsThreeQuarter?: number;
  mainLevelBedrooms?: number;
  mainLevelBathrooms?: number;

  // Building details
  stories?: string;
  roofType?: string;
  foundationDetails?: string[];
  constructionMaterials?: string[];
  windowFeatures?: string[];

  // Location details
  subdivision?: string;
  subdivisionName?: string;
  county?: string;
  cityId?: number;
  parcelNumber?: string;

  // Agent information
  contact_recipients?: unknown[];
  listed_by?: {
    agent_reason?: number;
    zpro?: boolean;
    recent_sales?: number;
    review_count?: number;
    display_name?: string;
    badge_type?: string;
    business_name?: string;
    rating_average?: number;
    phone?: {
      prefix?: string;
      areacode?: string;
      number?: string;
    };
    zuid?: string;
    image_url?: string;
  };

  // Schools
  schools?: Array<{
    name?: string;
    rating?: number;
    level?: string;
    grades?: string;
    type?: string;
    distance?: number;
    isAssigned?: boolean;
    studentsPerTeacher?: number;
    size?: number;
    link?: string;
  }>;

  // Price history
  priceHistory?: Array<{
    date?: string;
    price?: number;
    event?: string;
    priceChangeRate?: number;
    source?: string;
    pricePerSquareFoot?: number;
  }>;

  // Nearby homes
  nearbyHomes?: unknown[];

  // At a glance facts
  atAGlanceFacts?: Array<{
    factLabel?: string;
    factValue?: string;
  }>;

  // Additional details
  description?: string;
  url?: string;
  mlsid?: string;
  pageViewCount?: number;
  favoriteCount?: number;
  virtualTour?: string;
  buildingName?: string;

  // Mortgage rates
  mortgageRates?: {
    thirtyYearFixedRate?: number;
    fifteenYearFixedRate?: number;
    arm5Rate?: number;
  };
};

// Isochrone data structure
export type IsochroneData = {
  // Original API response structure
  isochrone?: {
    type: string;
    geometry: {
      type: string;
      coordinates: number[][][];
    };
  };
  individual_isochrones?: Array<{
    address: string;
    commute_tolerance?: number;
    name?: string;
    isochrone: unknown;
  }>;
  center?: {
    lat: number;
    lon: number;
    address: string;
    name?: string;
  };
  locations?: Array<{
    address: string;
    commute_tolerance?: number;
    lat?: number | null;
    lng?: number | null;
    name?: string;
  }>;
  commute_tolerance?: number;
  mode?: string;
  // Legacy compatibility fields
  polygon?: Array<{ lat: number; lng: number }>;
};

// Centralized score formatting utility
export const getMatchScore = (property: SearchResult): number => {
  return property._score ?? 0; // Backend ML score (0-100 integer)
};
