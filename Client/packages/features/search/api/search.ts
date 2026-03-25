import { log, LOG_CATEGORIES } from "packages/logger";
import { apiGet, apiPost, buildApiUrl } from "packages/services/http/compatibility";
import type { SearchByPolygonRequest, SearchByPolygonResponse } from "packages/types/api";

/** Log-safe summary of polygon search request (no addresses / PII). */
function summarizePolygonSearchRequestForLog(req: SearchByPolygonRequest) {
  const up = req.user_preferences;
  const upKeys =
    up && typeof up === "object" && !Array.isArray(up) ? Object.keys(up as object) : [];
  return {
    perBucketPages: req.perBucketPages,
    forceSearch: req.forceSearch,
    onlyCached: req.onlyCached,
    userPreferenceKeyCount: upKeys.length,
    userPreferenceKeysSample: upKeys.slice(0, 12),
  };
}

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

// Re-export for convenience
export type PolygonSearchRequest = SearchByPolygonRequest;
export type PolygonSearchResponse = SearchByPolygonResponse;

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
      address: string;
      commute_tolerance?: number;
      name?: string;
      isochrone: unknown;
    }>;
    center: {
      lat: number;
      lon: number;
      address: string;
      name?: string;
    };
    locations: Array<{
      address: string;
      commute_tolerance?: number;
      lat?: number | null;
      lng?: number | null;
      name?: string;
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
    address: string;
    commute_tolerance?: number;
    name?: string;
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
    options?: { signal?: AbortSignal }
  ): Promise<PropertyCompsResponse> => {
    const url = buildApiUrl("/api/v1/search/propertyComps", {
      address: params.address,
      radius: params.radius,
      count: params.count,
    });

    return apiGet<PropertyCompsResponse>(url, {
      timeout: 300000, // 5 minutes for property comps search
      ...options,
    })
      .then((resp) => {
        const respWithComps = resp as typeof resp & { comps?: unknown[] };
        log.debug(LOG_CATEGORIES.API, "getPropertyComps response", {
          success: resp?.success,
          compsCount: Array.isArray(respWithComps?.comps) ? respWithComps.comps.length : undefined,
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
    options?: { signal?: AbortSignal }
  ): Promise<PolygonSearchResponse> => {
    const url = "/api/v1/search/properties-by-polygon";
    log.info(LOG_CATEGORIES.POLYGON_SEARCH, "searchByPolygon API request", {
      url,
      requestSummary: summarizePolygonSearchRequestForLog(data),
    });
    return apiPost<PolygonSearchResponse>(url, data, {
      timeout: 300000, // 5 minutes for polygon search
      ...options,
    })
      .then((resp) => {
        const rawCount = Array.isArray(resp.properties) ? resp.properties.length : 0;
        const meta = resp.meta;
        log.info(LOG_CATEGORIES.POLYGON_SEARCH, "searchByPolygon API response", {
          success: resp.success,
          error: resp.error,
          propertiesCount: rawCount,
          totalCount: resp.total_count,
          metaCached: meta?.cached,
          metaDeduped: meta?.deduped,
          metaRequestsMade: meta?.requestsMade,
          metaLimit: meta?.limit,
          requestSummary: summarizePolygonSearchRequestForLog(data),
        });
        // #region agent log
        // eslint-disable-next-line no-restricted-globals -- Cursor debug NDJSON ingest (session 8adfea)
        fetch("http://127.0.0.1:7449/ingest/62a2c70d-285c-439c-8ad0-211f81794197", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "8adfea",
          },
          body: JSON.stringify({
            sessionId: "8adfea",
            location: "search.ts:searchByPolygon",
            message: "polygon search API response",
            data: {
              success: resp.success,
              propertiesCount: rawCount,
              totalCount: resp.total_count,
              metaCached: meta?.cached,
              requestSummary: summarizePolygonSearchRequestForLog(data),
            },
            timestamp: Date.now(),
            hypothesisId: "B",
          }),
        }).catch(() => {});
        // #endregion
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
