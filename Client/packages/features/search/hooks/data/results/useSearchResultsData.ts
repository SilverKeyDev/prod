import { useCallback, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAuthStore } from "packages/store";

import { searchApi } from "@/features/search/api/search";
import type { SearchResult } from "@/features/search/types";
import { transformSearchResponse } from "@/features/search/utils/searchTransform";

/** Stable empty array to avoid new reference on every render when data is undefined */
const EMPTY_SEARCH_RESULTS: SearchResult[] = [];

export type UseSearchResultsDataReturn = {
  searchResults: SearchResult[];
  isLoading: boolean;
  error: string | null;
  setSearchResults: (results: SearchResult[]) => void;
  clearSearchResults: () => void;
  refetchCachedResults: () => void;
};

export type UseSearchResultsDataOptions = {
  /** When true, do not auto-load onlyCached results (e.g. agents until explicit search). */
  skipInitialFetch?: boolean;
};

/**
 * Hook for managing search results with React Query.
 * Server returns stored results for onlyCached requests without running a new search;
 * fresh results come from setSearchResults after the user runs a search (forceSearch).
 */
export function useSearchResultsData(
  options?: UseSearchResultsDataOptions,
): UseSearchResultsDataReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const skipInitialFetch = options?.skipInitialFetch ?? false;

  const shouldLoadData = useMemo(
    () => authReady && isAuthenticated && !skipInitialFetch,
    [authReady, isAuthenticated, skipInitialFetch],
  );

  const {
    data: searchResultsData,
    isLoading,
    error,
    refetch: refetchCachedResults,
  } = useQuery({
    queryKey: queryKeys.search.results(),
    queryFn: async () => {
      try {
        log.debug(
          LOG_CATEGORIES.POLYGON_SEARCH,
          "Fetching search results from database",
        );
        const response = await searchApi.searchByPolygon({
          perBucketPages: 20,
          onlyCached: true, // Return stored results from DB (HomeUniversal), don't trigger new search
        });

        if (!response.success) {
          log.warn(
            LOG_CATEGORIES.POLYGON_SEARCH,
            "Search API returned unsuccessful response",
            {
              error: response.error,
            },
          );
          return [] as SearchResult[];
        }

        const rawLen = Array.isArray(response.properties)
          ? response.properties.length
          : 0;
        log.info(
          LOG_CATEGORIES.POLYGON_SEARCH,
          "onlyCached DB load: API response before transform",
          {
            propertiesCount: rawLen,
            totalCount: response.total_count,
            metaCached: response.meta?.cached,
          },
        );

        const transformedResults = transformSearchResponse(response);

        if (transformedResults.length > 0) {
          log.info(
            LOG_CATEGORIES.POLYGON_SEARCH,
            "Loaded search results from database",
            {
              count: transformedResults.length,
            },
          );
        } else {
          log.info(
            LOG_CATEGORIES.POLYGON_SEARCH,
            "No search results in database, returned empty",
          );
        }

        return transformedResults;
      } catch (error) {
        log.error(
          LOG_CATEGORIES.ERRORS,
          "Failed to fetch search results from database",
          error,
        );
        return [] as SearchResult[];
      }
    },
    enabled: shouldLoadData,
    staleTime: Infinity, // Never stale - cached results stay until new search or explicit refetch
    // Keep results while navigating away from Search so back-navigation still shows homes + map context
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Mutation to set search results (updates React Query cache after new search)
  const setSearchResultsMutation = useMutation({
    mutationFn: async (results: SearchResult[]) => {
      // Update cache directly
      queryClient.setQueryData(queryKeys.search.results(), results);
      return results;
    },
  });

  const setSearchResults = useCallback(
    (results: SearchResult[]) => {
      setSearchResultsMutation.mutate(results);
    },
    [setSearchResultsMutation],
  );

  const clearSearchResults = useCallback(() => {
    queryClient.setQueryData(queryKeys.search.results(), []);
  }, [queryClient]);

  return {
    searchResults: searchResultsData ?? EMPTY_SEARCH_RESULTS,
    isLoading,
    error: error?.message ?? null,
    setSearchResults,
    clearSearchResults,
    refetchCachedResults: () => {
      void refetchCachedResults();
    },
  };
}
