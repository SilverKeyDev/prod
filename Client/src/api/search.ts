import { apiGet, apiPost, buildApiUrl } from './utils/index';

// Types for search API
interface PropertyComp {
  address: string;
  price: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  lot_size?: number;
  year_built?: number;
  distance?: number;
  sale_date?: string;
}

export interface PropertyCompsRequest {
  address: string;
  radius?: number;
  count?: number;
}

export interface PropertyCompsResponse {
  success: boolean;
  comps?: PropertyComp[];
  error?: string;
}

export interface PropertyRequest {
  address: string;
}

interface SearchQuery {
  address: string;
  filters?: Record<string, unknown>;
}

interface PropertyData {
  address?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  lot_size?: number;
  year_built?: number;
  property_type?: string;
  status?: string;
  description?: string;
  features?: string[];
  [key: string]: unknown;
}

interface PropertyFeatures {
  interior?: string[];
  exterior?: string[];
  appliances?: string[];
  heating_cooling?: string[];
  parking?: string[];
  lot?: string[];
}

interface CommuteData {
  destinations?: Array<{
    name: string;
    address: string;
    distance?: number;
    duration?: number;
    mode?: string;
  }>;
  transit_score?: number;
  walkability_score?: number;
}

interface PropertyAnalysis {
  summary?: string;
  pros?: string[];
  cons?: string[];
  market_analysis?: string;
  investment_potential?: string;
  neighborhood_info?: string;
}

interface ImageFeatures {
  exterior_photos?: string[];
  interior_photos?: string[];
  analyzed_features?: string[];
  property_condition?: string;
}

export interface PropertyResponse {
  success: boolean;
  query?: SearchQuery;
  data?: PropertyData;
  features?: PropertyFeatures;
  commute_data?: CommuteData;
  property_analysis?: PropertyAnalysis;
  image_features?: ImageFeatures;
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

interface SearchProperty {
  id: string;
  address: string;
  price: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  lat?: number;
  lng?: number;
  images?: string[];
  features?: string[];
  status?: string;
}

export interface PolygonSearchResponse {
  success: boolean;
  properties?: SearchProperty[];
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
      isochrone: {
        type: string;
        geometry: {
          type: string;
          coordinates: number[][][];
        };
        properties?: Record<string, unknown>;
      };
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
  getPropertyComps: (params: PropertyCompsRequest): Promise<PropertyCompsResponse> => {
    const url = buildApiUrl('/api/v1/search/propertyComps', {
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
    apiPost<PropertyResponse>('/api/v1/search/property', data),

  /**
   * Search properties within a polygon area
   */
  searchByPolygon: (data: PolygonSearchRequest): Promise<PolygonSearchResponse> =>
    apiPost<PolygonSearchResponse>('/api/v1/search/properties-by-polygon', data),

  /**
   * Generate isochrone polygon data based on user preferences
   */
  getIsochrone: (): Promise<IsochroneResponse> =>
    apiGet<IsochroneResponse>('/api/v1/search/isochrone'),

};