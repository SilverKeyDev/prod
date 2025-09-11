import { apiGet, apiPost, buildApiUrl } from "./utils/index";

// Types for search API
export interface PropertyCompsRequest {
  address: string;
  radius?: number;
  count?: number;
}

export interface PropertyCompsResponse {
  success: boolean;
  comps?: Record<string, unknown>[];
  error?: string;
}

export interface PropertyRequest {
  address: string;
}

export interface PropertyResponse {
  success: boolean;
  query?: Record<string, unknown>;
  data?: Record<string, unknown>;
  features?: Record<string, unknown>;
  commute_data?: Record<string, unknown>;
  property_analysis?: Record<string, unknown>;
  image_features?: Record<string, unknown>;
  zillow_url?: string;
  images?: string[];
  error?: string;
}

export interface PolygonSearchRequest {
  user_preferences: {
    home_budget?: number;
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
}

export interface PolygonSearchResponse {
  success: boolean;
  properties?: Record<string, unknown>[];
  total_count?: number;
  has_more?: boolean;
  error?: string;
}

export interface IsochroneResponse {
  success: boolean;
  data?: {
    isochrone: {
      type: string;
      geometry: {
        type: string;
        coordinates: number[][][];
      };
    };
    individual_isochrones: Array<{
      name: string;
      address: string;
      commute_tolerance: number;
      isochrone: Record<string, unknown>;
    }>;
    center: {
      lat: number;
      lon: number;
      address: string;
      name: string;
    };
    locations: Array<{
      name: string;
      address: string;
      commute_tolerance: number;
      lat: number | null;
      lng: number | null;
    }>;
    commute_tolerance: number;
    mode: string;
  };
  // Legacy fields for backward compatibility
  isochrone_data?: {
    type: string;
    coordinates: number[][][];
  };
  locations?: Array<{
    name: string;
    address: string;
    commute_tolerance: number;
  }>;
  error?: string;
}

/**
 * Search API client using centralized utilities
 */
export const searchApi = {
  /**
   * Get property comparables using Zillow API
   */
  getPropertyComps: (
    params: PropertyCompsRequest,
  ): Promise<PropertyCompsResponse> => {
    const url = buildApiUrl("/api/v1/search/propertyComps", {
      address: params.address,
      radius: params.radius,
      count: params.count,
    });
    return apiGet<PropertyCompsResponse>(url);
  },

  /**
   * Get property details via address using RapidAPI Zillow
   */
  getProperty: (data: PropertyRequest): Promise<PropertyResponse> =>
    apiPost<PropertyResponse>("/api/v1/search/property", data),

  /**
   * Search properties within a polygon area
   */
  searchByPolygon: (
    data: PolygonSearchRequest,
  ): Promise<PolygonSearchResponse> =>
    apiPost<PolygonSearchResponse>(
      "/api/v1/search/properties-by-polygon",
      data,
    ),

  /**
   * Generate isochrone polygon data based on user preferences
   */
  getIsochrone: (): Promise<IsochroneResponse> =>
    apiGet<IsochroneResponse>("/api/v1/search/isochrone"),
};
