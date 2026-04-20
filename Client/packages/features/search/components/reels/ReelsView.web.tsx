import { useEffect, useMemo } from "react";

import type { MutableRefObject } from "react";
import type { VirtuosoHandle } from "react-virtuoso";

import { getBaseUrl } from "packages/config";
import {
  FeedScrollContainer,
  type FeedScrollController,
  initBeaconFlush,
  listingToReelMedia,
  setBaseUrlGetter,
} from "packages/features/feed";
import type { SearchResult } from "packages/features/search/types";
import { useReelsCleanup } from "packages/hooks/ui";
import { Box } from "packages/ui/components/primitives";
import { searchResultToFeedListing } from "packages/utils/search/feed/searchResultToFeedListing";

import { ReelsSearchEmptyState } from "./ReelsSearchEmptyState";

type ReelsViewProps = {
  filteredSearchResults: SearchResult[];
  onRunSearch: () => void | Promise<void>;
  isSearching?: boolean;
  virtuosoRef?: React.RefObject<VirtuosoHandle | null>;
  scrollControllerRef?: MutableRefObject<FeedScrollController | null>;
  /** Optional class for root (e.g. h-full when used inside a fixed-height desktop container). */
  className?: string;
};

const noopFetchNextPage = () => {};

/**
 * Reels view — search-backed listings with per-home image carousel.
 */
export function ReelsView({
  filteredSearchResults,
  onRunSearch,
  isSearching = false,
  virtuosoRef,
  scrollControllerRef,
  className,
}: ReelsViewProps) {
  useReelsCleanup();
  useEffect(() => {
    setBaseUrlGetter(getBaseUrl);
    initBeaconFlush();
  }, []);

  const items = useMemo(
    () => filteredSearchResults.map((row) => listingToReelMedia(searchResultToFeedListing(row))),
    [filteredSearchResults]
  );

  if (filteredSearchResults.length === 0) {
    return (
      <Box className={`h-full w-full bg-black ${className ?? ""}`} data-reels-feed-container>
        <ReelsSearchEmptyState onSearch={onRunSearch} isSearching={isSearching} />
      </Box>
    );
  }

  return (
    <Box className={`h-full w-full bg-black ${className ?? ""}`} data-reels-feed-container>
      <FeedScrollContainer
        items={items}
        fetchNextPage={noopFetchNextPage}
        hasNextPage={false}
        isFetchingNextPage={false}
        virtuosoRef={virtuosoRef ?? undefined}
        scrollControllerRef={scrollControllerRef}
      />
    </Box>
  );
}
