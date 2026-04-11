import { useEffect, useMemo } from "react";

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
import { searchResultToFeedListing } from "packages/utils/search/searchResultToFeedListing";

import { ReelsSearchEmptyState } from "./ReelsSearchEmptyState";

type ReelsViewProps = {
  filteredSearchResults: SearchResult[];
  onRunSearch: () => void | Promise<void>;
  isSearching?: boolean;
  virtuosoRef?: React.RefObject<unknown>;
  scrollControllerRef?: React.MutableRefObject<FeedScrollController | null>;
  /** Optional style for root (ignored on native; kept for API parity). */
  className?: string;
};

const noopFetchNextPage = () => {};

/**
 * Shared vertical feed backed by search results (web + native).
 */
export function ReelsView({
  filteredSearchResults,
  onRunSearch,
  isSearching = false,
  scrollControllerRef,
}: ReelsViewProps) {
  useReelsCleanup();
  useEffect(() => {
    setBaseUrlGetter(getBaseUrl);
    initBeaconFlush();
  }, []);

  const items = useMemo(
    () =>
      filteredSearchResults.map((row) =>
        listingToReelMedia(searchResultToFeedListing(row)),
      ),
    [filteredSearchResults],
  );

  if (filteredSearchResults.length === 0) {
    return (
      <Box className="bg-text-primary w-full flex-1">
        <ReelsSearchEmptyState
          onSearch={onRunSearch}
          isSearching={isSearching}
        />
      </Box>
    );
  }

  return (
    <Box className="bg-text-primary w-full flex-1">
      <FeedScrollContainer
        items={items}
        fetchNextPage={noopFetchNextPage}
        hasNextPage={false}
        isFetchingNextPage={false}
        scrollControllerRef={scrollControllerRef}
      />
    </Box>
  );
}
