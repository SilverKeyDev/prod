import {
  apiGet,
  apiPost,
  buildApiUrl,
} from "../../services/http/compatibility";

// Types for search API
export type PropertyCompsRequest = {
  address: string;
  radius?: number;
  count?: number;
};

export type PropertyCompsResponse = {
  success: boolean;
  comps?: unknown[];
  error?: string;
};

export type PropertyRequest = {
  address: string;
};

export type PropertyResponse = {
  success: boolean;
  query?: unknown;
  data?: unknown;
  features?: unknown;
  commute_data?: unknown;
  property_analysis?: unknown;
  image_features?: unknown;
  zillow_url?: string;
  images?: string[];
  error?: string;
};

export type PolygonSearchRequest = {
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
};

export type PolygonSearchResponse = {
  success: boolean;
  properties?: unknown[];
  total_count?: number;
  has_more?: boolean;
  error?: string;
};

export type IsochroneResponse = {
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
      isochrone: unknown;
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
};

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
    console.log("🔎 [searchApi.getPropertyComps] Request", { url, params });
    return apiGet<PropertyCompsResponse>(url, {
      timeout: 300000, // 5 minutes for property comps search
    })
      .then((resp) => {
        console.log("✅ [searchApi.getPropertyComps] Response", {
          success: resp?.success,
          compsCount: Array.isArray((resp as any)?.comps)
            ? (resp as any).comps.length
            : undefined,
          hasError: !!resp?.error,
        });
        return resp;
      })
      .catch((error) => {
        console.error("❌ [searchApi.getPropertyComps] Error", {
          message: String(error),
        });
        throw error;
      });
  },

  /**
   * Get property details via address using RapidAPI Zillow
   */
  getProperty: (data: PropertyRequest): Promise<PropertyResponse> => {
    const url = "/api/v1/search/property";
    console.log("🔎 [searchApi.getProperty] Request", { url, body: data });
    return apiPost<PropertyResponse>(url, data, {
      timeout: 300000, // 5 minutes for property search
    })
      .then((resp) => {
        console.log("✅ [searchApi.getProperty] Response", {
          success: resp?.success,
          hasData: !!resp?.data,
          hasFeatures: !!resp?.features,
          hasCommute: !!resp?.commute_data,
          hasAnalysis: !!resp?.property_analysis,
          imagesCount: Array.isArray(resp?.images)
            ? resp?.images?.length
            : undefined,
          hasError: !!resp?.error,
        });
        return resp;
      })
      .catch((error) => {
        console.error("❌ [searchApi.getProperty] Error", {
          message: String(error),
        });
        throw error;
      });
  },

  /**
   * Search properties within a polygon area
   */
  searchByPolygon: (
    data: PolygonSearchRequest,
  ): Promise<PolygonSearchResponse> => {
    const url = "/api/v1/search/properties-by-polygon";
    return apiPost<PolygonSearchResponse>(url, data, {
      timeout: 300000, // 5 minutes for polygon search
    })
      .then((resp) => {
        return resp;
      })
      .catch((error) => {
        console.error("❌ [searchApi.searchByPolygon] Error", {
          message: String(error),
        });
        throw error;
      });
  },

  /**
   * Generate isochrone polygon data based on user preferences
   */
  getIsochrone: (): Promise<IsochroneResponse> => {
    const url = "/api/v1/search/isochrone";
    console.log("🔎 [searchApi.getIsochrone] Request", { url });
    return apiGet<IsochroneResponse>(url, {
      timeout: 300000, // 5 minutes for isochrone generation
    })
      .then((resp) => {
        console.log("✅ [searchApi.getIsochrone] Response", {
          success: resp?.success,
          hasData: !!resp?.data,
          hasIsochrone: !!resp?.data?.isochrone,
          locationsCount: resp?.data?.locations?.length,
          hasError: !!resp?.error,
        });
        return resp;
      })
      .catch((error) => {
        console.error("❌ [searchApi.getIsochrone] Error", {
          message: String(error),
        });
        throw error;
      });
  },
};
