/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * This file re-exports types from the generated API contract (api.generated.ts).
 * All type definitions have been moved to openapi.yaml.
 *
 * To add/modify API types:
 * 1. Edit openapi.yaml
 * 2. Run `pnpm generate:api-types`
 * 3. Types will be auto-generated in packages/types/api.generated.ts
 *
 * This shim maintains backward compatibility for existing imports.
 */

import { log, LOG_CATEGORIES } from "packages/logger";
import {
  apiGet,
  apiPost,
  buildApiUrl,
  HttpError,
  isAbortError,
} from "packages/services/http/compatibility";
import type { components } from "packages/types/api.generated";
import type { AreaBoundaryResponse, AreaSuggestionsResponse } from "packages/types/domain/api";
import type { SearchByPolygonRequest, SearchByPolygonResponse } from "packages/types/domain/api";

// UI type (not API contract - keep local)
export type GetIsochroneOptions = {
  preferencesUserId?: string | null;
  signal?: AbortSignal;
};

/** Backend returns 400 + JSON when preferences have no usable commute locations (expected). */
function isIsochroneMissingCommuteHttpError(error: unknown): error is HttpError {
  if (!(error instanceof HttpError)) return false;
  if (error.status !== 400) return false;
  const b = error.parsedBody;
  if (!b || typeof b !== "object") return false;
  const rec = b as { success?: boolean; error?: string };
  return (
    rec.success === false &&
    (rec.error === "NO_LOCATIONS" || rec.error === "NO_VALID_LOCATIONS")
  );
}

/** Log-safe summary of polygon search request (no addresses / PII). */
function summarizePolygonSearchRequestForLog(req: SearchByPolygonRequest) {
  const up = req.user_preferences;
  const upKeys =
    up && typeof up === "object" && !Array.isArray(up) ? Object.keys(up as object) : [];
  return {
    perBucketPages: req.perBucketPages,
    forceSearch: req.forceSearch,
    onlyCached: req.onlyCached,
    preferencesStrictFilter: req.preferences_strict_filter === true,
    userPreferenceKeyCount: upKeys.length,
    userPreferenceKeysSample: upKeys.slice(0, 12),
    viewportPointCount: Array.isArray(req.viewport_polygon) ? req.viewport_polygon.length : 0,
  };
}

// Re-export types from generated schema
export type PropertyCompsRequest = components["schemas"]["PropertyCompsRequest"];
export type PropertyCompsResponse = components["schemas"]["PropertyCompsResponse"];

// Re-export for convenience
export type PolygonSearchRequest = SearchByPolygonRequest;
export type PolygonSearchResponse = SearchByPolygonResponse;

export type MonthlyCostEstimatesResponse = components["schemas"]["MonthlyCostEstimatesResponse"];
export type IsochroneResponse = components["schemas"]["IsochroneResponse"];

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
        if (!isAbortError(error)) {
          log.error(LOG_CATEGORIES.ERRORS, "getPropertyComps error", {
            message: String(error),
          });
        }
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
          metaSearchArea:
            meta && "searchArea" in meta ? (meta as { searchArea?: string }).searchArea : undefined,
          requestSummary: summarizePolygonSearchRequestForLog(data),
        });
        return resp;
      })
      .catch((error) => {
        if (!isAbortError(error)) {
          log.error(LOG_CATEGORIES.ERRORS, "Search API error", error);
        }
        throw error;
      });
  },

  /**
   * Generate isochrone polygon data based on user preferences
   */
  getIsochrone: async (options?: GetIsochroneOptions): Promise<IsochroneResponse> => {
    const uid = options?.preferencesUserId;
    const url = buildApiUrl(
      "/api/v1/search/isochrone",
      uid != null && uid !== "" ? { preferences_user_id: uid } : {}
    );
    try {
      return await apiGet<IsochroneResponse>(url, {
        timeout: 300000, // 5 minutes for isochrone generation
        signal: options?.signal,
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
      if (isIsochroneMissingCommuteHttpError(error)) {
        const body = error.parsedBody as { error?: string; message?: string };
        log.warn(LOG_CATEGORIES.SEARCH, "Isochrone skipped: no commute locations in preferences", {
          error: body.error,
        });
        return {
          success: false,
          error: body.error ?? "NO_LOCATIONS",
          message: body.message ?? null,
        } as unknown as IsochroneResponse;
      }
      log.error(LOG_CATEGORIES.ERRORS, "Isochrone API error", error);
      throw error;
    }
  },

  /**
   * Search for geographic areas (neighborhoods, cities, ZIP codes) via Slipstream.
   */
  getAreaSuggestions: (
    params: { keyword: string; state?: string; limit?: number },
    options?: { signal?: AbortSignal }
  ): Promise<AreaSuggestionsResponse> => {
    const url = buildApiUrl("/api/v1/search/area-suggestions", {
      keyword: params.keyword,
      ...(params.state ? { state: params.state } : {}),
      ...(params.limit ? { limit: String(params.limit) } : {}),
    });
    return apiGet<AreaSuggestionsResponse>(url, {
      timeout: 10_000,
      ...options,
    }).catch((error) => {
      if (!isAbortError(error)) {
        log.error(LOG_CATEGORIES.ERRORS, "getAreaSuggestions error", {
          message: String(error),
        });
      }
      throw error;
    });
  },

  /**
   * Get the boundary polygon for a Slipstream area by ID.
   */
  getAreaBoundary: (
    params: { id: string },
    options?: { signal?: AbortSignal }
  ): Promise<AreaBoundaryResponse> => {
    const url = buildApiUrl("/api/v1/search/area-boundary", {
      id: params.id,
    });
    return apiGet<AreaBoundaryResponse>(url, {
      timeout: 30_000,
      ...options,
    }).catch((error) => {
      if (!isAbortError(error)) {
        log.error(LOG_CATEGORIES.ERRORS, "getAreaBoundary error", {
          message: String(error),
        });
      }
      throw error;
    });
  },

  /**
   * Placeholder HOA and area utilities (USD/month); both zero until backend data sources exist.
   */
  getMonthlyCostEstimates: (
    params: { zipcode: string },
    options?: { signal?: AbortSignal }
  ): Promise<MonthlyCostEstimatesResponse> => {
    const url = buildApiUrl("/api/v1/search/monthly-cost-estimates", {
      zipcode: params.zipcode,
    });
    return apiGet<MonthlyCostEstimatesResponse>(url, {
      timeout: 30_000,
      ...options,
    }).catch((error) => {
      if (!isAbortError(error)) {
        log.error(LOG_CATEGORIES.ERRORS, "getMonthlyCostEstimates error", {
          message: String(error),
        });
      }
      throw error;
    });
  },
};
