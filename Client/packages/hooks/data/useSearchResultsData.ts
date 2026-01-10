import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useAuthStore } from "../../store/auth.slice";
import { queryKeys } from "../../config/query/keys";
import { searchApi } from "../../config/api/search";
import { transformSearchResponse } from "../../services/search";
import { log, LOG_CATEGORIES } from "../../../logger";
import type { SearchResult } from "../../schemas/search";

export type UseSearchResultsDataReturn = {
  searchResults: SearchResult[];
  isLoading: boolean;
  error: string | null;
  setSearchResults: (results: SearchResult[]) => void;
  clearSearchResults: () => void;
  refetchCachedResults: () => void;
};

/**
 * Hook for managing search results with React Query
 * Replaces localStorage-based caching with React Query cache
 */
export function useSearchResultsData(): UseSearchResultsDataReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Check cache first when enabled becomes true (cache-first strategy)
  const shouldLoadData = useMemo(
    () => authReady && isAuthenticated,
    [authReady, isAuthenticated]
  );

  // Fetch cached search results on mount
  const {
    data: searchResultsData,
    isLoading,
    error,
    refetch: refetchCachedResults,
  } = useQuery({
    queryKey: queryKeys.search.results(),
    queryFn: async () => {
      // Call search API which will return cached results if available
      // Backend handles cache validation and returns cached or performs new search
      try {
        log.debug(
          LOG_CATEGORIES.API,
          "Fetching cached search results on mount",
        );
        const response = await searchApi.searchByPolygon({
          perBucketPages: 20,
          onlyCached: true, // Only fetch cached results on mount, don't trigger search
        });

        if (!response.success) {
          log.warn(
            LOG_CATEGORIES.API,
            "Search API returned unsuccessful response",
            {
              error: response.error,
            },
          );
          return [] as SearchResult[];
        }

        // Transform API response to SearchResult format
        const transformedResults = transformSearchResponse(response);

        // Log cache status if available
        if (response.meta?.cached) {
          log.info(
            LOG_CATEGORIES.API,
            "Loaded cached search results on mount",
            {
              count: transformedResults.length,
              cacheAge: response.meta.cacheAge,
            },
          );
        } else {
          log.info(
            LOG_CATEGORIES.API,
            "No cached results available, returned empty",
          );
        }

        return transformedResults;
      } catch (error) {
        log.error(
          LOG_CATEGORIES.ERRORS,
          "Failed to fetch cached search results",
          error,
        );
        return [] as SearchResult[];
      }
    },
    enabled: shouldLoadData,
    // Use placeholderData to check cache reactively when enabled changes
    placeholderData: (previousValue) => {
      const cached = queryClient.getQueryData<SearchResult[]>(
        queryKeys.search.results(),
      );
      return cached ?? previousValue ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for this long
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Fetch on mount to get cached results
    refetchOnReconnect: false,
  });

  // Mutation to set search results (updates cache)
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
    searchResults: searchResultsData ?? [],
    isLoading,
    error: error?.message ?? null,
    setSearchResults,
    clearSearchResults,
    refetchCachedResults: () => {
      void refetchCachedResults();
    },
  };
}
