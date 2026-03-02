import { useInfiniteQuery } from "@tanstack/react-query";

import { feedApi } from "packages/features/feed/api/feed";
import { useSearchContextStore } from "packages/store";

import type { FeedListing } from "@/features/feed/types/feed";

const PAGE_SIZE = 10;

/**
 * Hook for infinite feed data - uses SearchContext (filtersHash, anchor, cursor).
 * Uses placeholder/mock when API is unavailable.
 */
export function useFeedData() {
  const filtersHash = useSearchContextStore((s) => s.filtersHash);
  const anchor = useSearchContextStore((s) => s.anchor);
  const feedCursor = useSearchContextStore((s) => s.feedCursor);

  const query = useInfiniteQuery({
    queryKey: ["feed", filtersHash, anchor.listingId, feedCursor],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        return await feedApi.getFeed({
          page: pageParam as number,
          limit: PAGE_SIZE,
          filtersHash: filtersHash || undefined,
          anchor: anchor.listingId ? { listingId: anchor.listingId } : undefined,
          cursor: pageParam === 0 ? undefined : feedCursor,
        });
      } catch {
        return { items: [] as FeedListing[], hasMore: false };
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore || lastPage.items.length === 0) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  return { ...query, items };
}
