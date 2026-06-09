import { useCallback, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useAuthStore } from "packages/store";

import { fetchCachedPolygonSearchResults } from "@/features/search/api/fetchCachedPolygonSearchResults";
import type { SearchResult } from "@/features/search/types";

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
 * Server returns stored results for onlyCached requests without running a new search;
 * fresh results come from setSearchResults after the user runs a search (forceSearch).
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
    queryFn: () => fetchCachedPolygonSearchResults({ verboseLog: true }),
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
