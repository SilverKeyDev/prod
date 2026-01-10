// API-related type definitions

export type ApiSuccess<T> = {
  success: true;
  [k: string]: unknown;
  data?: T;
};

export type ApiError = {
  success: false;
  error?: string;
  [k: string]: unknown;
};

export type FetchJsonOpts = RequestInit & {
  acceptStatuses?: number[];
  timeout?: number;
};

export type RetryOpts = {
  retries?: number;
  retryOnStatuses?: number[];
  retryDelayMs?: number;
  backoffFactor?: number;
  jitter?: boolean;
};

export type ApiRequestOptions = {
  includeCredentials?: boolean;
  includeAuth?: boolean;
  authToken?: string;
  acceptStatuses?: number[];
  timeout?: number;
  useCors?: boolean;
  baseUrl?: string;
} & RequestInit &
  RetryOpts;

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// API Configuration
// In development: empty string uses Vite proxy
// In production: full URL to production backend
export const BASE_URL =
  typeof import.meta !== "undefined" && import.meta.env.DEV
    ? ""
    : "https://usesilverkey.com";

// API response types for type safety

export type HomeUniversal = {
  address: string;
  price?: number;
  beds?: string;
  baths?: string;
  sqft?: string;
  lot_size?: number;
  property_type?: string;
  listing_status?: string;
  image_url?: string;
  lat?: number;
  lng?: number;
};

export type PropertySearchResult = {
  zpid?: string;
  address?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  latitude?: number;
  longitude?: number;
  lotAreaValue?: number;
  lotAreaUnit?: string;
  propertyType?: string;
  listingStatus?: string;
  imgSrc?: string;
  _score?: number;
};

export type IsochroneGeometry = {
  geometry: {
    coordinates: number[][][];
    type: string;
  };
};

export type IsochroneData = {
  isochrone: IsochroneGeometry;
  center: {
    lat: number;
    lng: number;
  };
  locations: Array<{
    name: string;
    address: string;
    commute_tolerance: number;
    lat: number | null;
    lng: number | null;
  }>;
};

export type UserPreferencesData = {
  home_budget_min?: number;
  home_budget_max?: number;
  priceRange?: {
    min?: number;
    max?: number;
  };
  preferredBedrooms?: number;
};

export type SearchByPolygonRequest = {
  // user_preferences is now optional - backend pulls from database
  user_preferences?: {
    home_budget_min?: number;
    home_budget_max?: number;
    preferred_bedrooms?: number;
    preferred_bathrooms?: number;
    preferred_housing_type?: string;
    preferred_home_age?: string;
    preferred_lot_size?: string;
    preferred_home_features?: string[];
    deal_breakers?: string[];
    important_locations?: Array<{
      name: string;
      address: string;
      commute_tolerance: number;
      lat: number | null;
      lng: number | null;
    }>;
  };
  perBucketPages?: number;
  onlyCached?: boolean; // Only return cached results, don't perform search if cache is invalid
};

export type SearchByPolygonResponse = {
  success: boolean;
  properties?: PropertySearchResult[];
  total_count?: number;
  has_more?: boolean;
  error?: string;
  meta?: {
    cached?: boolean;
    cacheAge?: string;
    requestsMade?: number;
    deduped?: number;
    errors?: unknown[];
    status_type?: string;
    pagesTried?: number;
    searchTime?: number;
    scored?: boolean;
    requestId?: string;
    limit?: number;
  };
};

export type FavoriteHomesResponse = {
  success: boolean;
  favorites?: HomeUniversal[];
  error?: string;
};

export type AddFavoriteHomeRequest = {
  home: {
    id: string;
    address: string;
    price: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    lat: number;
    lng: number;
    lotSize?: string;
    propertyType: string;
    listingStatus: string;
    imageUrl?: string;
  };
};

export type RemoveFavoriteHomeRequest = {
  address: string;
};

export type FavoriteHomeResponse = {
  success: boolean;
  favorites?: string[];
  error?: string;
};
