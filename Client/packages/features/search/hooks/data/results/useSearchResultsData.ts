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

/**
 * Hook for managing search results with React Query.
 * Results are never considered stale: cached data is shown until a new search runs
 * (setSearchResults) or the user explicitly refetches (refetchCachedResults).
 * This prevents refetches from overwriting good results with empty API responses.
 */
export function useSearchResultsData(): UseSearchResultsDataReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);

  const {
    data: searchResultsData,
    isLoading,
    error,
    refetch: refetchCachedResults,
  } = useQuery({
    queryKey: queryKeys.search.results(),
    queryFn: async () => {
      try {
        log.debug(LOG_CATEGORIES.SEARCH, "Fetching search results from database");
        const response = await searchApi.searchByPolygon({
          perBucketPages: 20,
          onlyCached: true, // Return stored results from DB (HomeUniversal), don't trigger new search
        });

        if (!response.success) {
          log.warn(LOG_CATEGORIES.SEARCH, "Search API returned unsuccessful response", {
            error: response.error,
          });
          return [] as SearchResult[];
        }

        const transformedResults = transformSearchResponse(response);

        if (transformedResults.length > 0) {
          log.info(LOG_CATEGORIES.SEARCH, "Loaded search results from database", {
            count: transformedResults.length,
          });
        } else {
          log.info(LOG_CATEGORIES.SEARCH, "No search results in database, returned empty");
        }

        return transformedResults;
      } catch (error) {
        log.error(LOG_CATEGORIES.ERRORS, "Failed to fetch search results from database", error);
        return [] as SearchResult[];
      }
    },
    enabled: shouldLoadData,
    staleTime: Infinity, // Never stale - cached results stay until new search or explicit refetch
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in memory for quick back/forward
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
    [setSearchResultsMutation]
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
