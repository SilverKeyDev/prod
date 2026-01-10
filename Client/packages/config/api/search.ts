import {
  apiGet,
  apiPost,
  buildApiUrl,
} from "../../services/http/compatibility";
import { log, LOG_CATEGORIES } from "../../../logger";

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

export type PolygonSearchRequest = {
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
   * Get property comparables using property API
   */
  getPropertyComps: (
    params: PropertyCompsRequest,
  ): Promise<PropertyCompsResponse> => {
    const url = buildApiUrl("/api/v1/search/propertyComps", {
      address: params.address,
      radius: params.radius,
      count: params.count,
    });

    return apiGet<PropertyCompsResponse>(url, {
      timeout: 300000, // 5 minutes for property comps search
    })
      .then((resp) => {
        const respWithComps = resp as typeof resp & { comps?: unknown[] };
        log.debug(LOG_CATEGORIES.API, "getPropertyComps response", {
          success: resp?.success,
          compsCount: Array.isArray(respWithComps?.comps)
            ? respWithComps.comps.length
            : undefined,
          hasError: !!resp?.error,
        });
        return resp;
      })
      .catch((error) => {
        log.error(LOG_CATEGORIES.ERRORS, "getPropertyComps error", {
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
        log.error(LOG_CATEGORIES.ERRORS, "Search API error", error);
        throw error;
      });
  },

  /**
   * Generate isochrone polygon data based on user preferences
   */
  getIsochrone: (): Promise<IsochroneResponse> => {
    const url = "/api/v1/search/isochrone";
    return apiGet<IsochroneResponse>(url, {
      timeout: 300000, // 5 minutes for isochrone generation
    })
      .then((resp) => {
        return resp;
      })
      .catch((error) => {
        log.error(LOG_CATEGORIES.ERRORS, "Isochrone API error", error);
        throw error;
      });
  },
};
