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
  useFeedData,
} from "packages/features/feed";
import { useReelsCleanup } from "packages/hooks/ui";

type ReelsViewProps = {
  virtuosoRef?: React.RefObject<VirtuosoHandle | null>;
  scrollControllerRef?: MutableRefObject<FeedScrollController | null>;
  /** Optional class for root (e.g. h-full when used inside a fixed-height desktop container). */
  className?: string;
};

/**
 * Reels view - vertical feed with HLS video support
 */
export function ReelsView({ virtuosoRef, scrollControllerRef, className }: ReelsViewProps) {
  useReelsCleanup();
  useEffect(() => {
    setBaseUrlGetter(getBaseUrl);
    initBeaconFlush();
  }, []);
  const { items: rawItems, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeedData();
  const items = useMemo(() => rawItems.map((listing) => listingToReelMedia(listing)), [rawItems]);

  return (
    <div className={`h-full w-full bg-black ${className ?? ""}`} data-reels-feed-container>
      <FeedScrollContainer
        items={items}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        virtuosoRef={virtuosoRef ?? undefined}
        scrollControllerRef={scrollControllerRef}
      />
    </div>
  );
}
