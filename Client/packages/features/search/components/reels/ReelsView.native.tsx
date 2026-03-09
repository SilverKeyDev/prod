import { useEffect, useMemo } from "react";

import { StyleSheet, View } from "react-native";

import { getBaseUrl } from "packages/config";
import { color } from "packages/design-tokens";
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
  virtuosoRef?: React.RefObject<unknown>;
  scrollControllerRef?: React.MutableRefObject<FeedScrollController | null>;
  /** Optional style for root (ignored on native; kept for API parity). */
  className?: string;
};

/**
 * Native: vertical feed with FlatList. Same data/scroll behavior as web.
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
    <View style={styles.container}>
      <FeedScrollContainer
        items={items}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        scrollControllerRef={scrollControllerRef}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: color("neutral.900"),
  },
});
