import { useEffect, useMemo } from "react";

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
import { Box } from "packages/ui/components/primitives";

type ReelsViewProps = {
  virtuosoRef?: React.RefObject<unknown>;
  scrollControllerRef?: React.MutableRefObject<FeedScrollController | null>;
  /** Optional style for root (ignored on native; kept for API parity). */
  className?: string;
};

/**
 * Shared vertical feed. Same data/scroll behavior on web and native.
 */
export function ReelsView({ scrollControllerRef }: ReelsViewProps) {
  useReelsCleanup();
  useEffect(() => {
    setBaseUrlGetter(getBaseUrl);
    initBeaconFlush();
  }, []);
  const { items: rawItems, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeedData();
  const items = useMemo(() => rawItems.map((listing) => listingToReelMedia(listing)), [rawItems]);

  return (
    <Box className="w-full flex-1 bg-neutral-900">
      <FeedScrollContainer
        items={items}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        scrollControllerRef={scrollControllerRef}
      />
    </Box>
  );
}
