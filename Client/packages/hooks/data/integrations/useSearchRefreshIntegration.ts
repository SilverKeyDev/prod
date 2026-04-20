import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";

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
      queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY }),
      // Invalidate isochrone only - not queryKeys.search.all. The latter refetches
      // ["search","results"] (onlyCached) and can overwrite a fresh setSearchResults()
      // payload with a stale or smaller DB snapshot (intermittent "one property").
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.search.all, "isochrone"],
      }),
    ]);
  }, [queryClient]);

  return { invalidateSearchAndFeed };
}
