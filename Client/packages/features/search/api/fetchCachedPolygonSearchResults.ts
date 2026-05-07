import type { SearchResult } from "packages/features/search/types/result";
import { transformSearchResponse } from "packages/features/search/utils/transform/searchTransform";
import { log, LOG_CATEGORIES } from "packages/logger";

import { searchApi } from "./search";

export type FetchCachedPolygonSearchResultsOptions = {
  /** Verbose polygon_search / error logs (e.g. hook); route prefetch stays quiet on success. */
  verboseLog?: boolean;
};

/**
 * Loads stored polygon search results only (no force search). Same contract for React Query
 * and login prefetch so cache keys stay consistent.
 */
export async function fetchCachedPolygonSearchResults(
  options?: FetchCachedPolygonSearchResultsOptions
): Promise<SearchResult[]> {
  const verboseLog = options?.verboseLog ?? false;
  try {
    if (verboseLog) {
      log.debug(LOG_CATEGORIES.POLYGON_SEARCH, "Fetching search results from database");
    }
    const response = await searchApi.searchByPolygon({
      perBucketPages: 20,
      onlyCached: true,
    });

    if (!response.success) {
      if (verboseLog) {
        log.warn(LOG_CATEGORIES.POLYGON_SEARCH, "Search API returned unsuccessful response", {
          error: response.error,
        });
      }
      return [];
    }

    if (verboseLog) {
      const rawLen = Array.isArray(response.properties) ? response.properties.length : 0;
      log.info(LOG_CATEGORIES.POLYGON_SEARCH, "onlyCached DB load: API response before transform", {
        propertiesCount: rawLen,
        totalCount: response.total_count,
        metaCached: response.meta?.cached,
      });
    }

    const transformedResults = transformSearchResponse(response);

    if (verboseLog) {
      if (transformedResults.length > 0) {
        log.info(LOG_CATEGORIES.POLYGON_SEARCH, "Loaded search results from database", {
          count: transformedResults.length,
        });
      } else {
        log.info(LOG_CATEGORIES.POLYGON_SEARCH, "No search results in database, returned empty");
      }
    }

    return transformedResults;
  } catch (error) {
    if (verboseLog) {
      log.error(LOG_CATEGORIES.ERRORS, "Failed to fetch search results from database", error);
    }
    return [];
  }
}
