import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";

import { fetchCachedPolygonSearchResults } from "@/features/search/api/fetchCachedPolygonSearchResults";

/** Query key prefix used by feed infinite query (useFeedData) */
const FEED_QUERY_KEY = ["feed"] as const;

export type UseSearchRefreshIntegrationReturn = {
  /** Invalidates React Query caches used by search and feed so both refetch with fresh data. */
  invalidateSearchAndFeed: () => Promise<void>;
};

/**
 * Centralizes invalidation of React Query keys used by both search and feed.
 * Use this for pull-to-refresh, toolbar refresh, or any "refresh" action so
 * web and mobile invalidate the same caches.
 */
export function useSearchRefreshIntegration(): UseSearchRefreshIntegrationReturn {
  const queryClient = useQueryClient();

  const invalidateSearchAndFeed = useCallback(async () => {
    await Promise.all([
      queryClient.fetchQuery({
        queryKey: queryKeys.search.results(),
        queryFn: () => fetchCachedPolygonSearchResults({ hydrateListings: true, verboseLog: true }),
      }),
      queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY }),
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.search.all, "isochrone"],
      }),
    ]);
  }, [queryClient]);

  return { invalidateSearchAndFeed };
}
