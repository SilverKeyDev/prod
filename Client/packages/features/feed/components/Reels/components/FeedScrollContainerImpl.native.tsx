import { useCallback } from "react";

import { FlatList, useWindowDimensions, View } from "react-native";

import { color } from "packages/design-tokens";
import { Text } from "packages/ui/components/primitives/text";

import type { FeedListing } from "@/features/feed/types/feed";

import type { FeedScrollContainerProps } from "./FeedScrollContainerTypes";

/** Empty state copy when feed has no reels (shared intent with web). */
const FEED_EMPTY_MESSAGE = "No reels right now. Check back later.";

/**
 * Native: FlatList with same data/onEndReached as web. Renders full-height reel cells
 * with a minimal cell view until FeedItemWithGesture.native exists.
 */
export function FeedScrollContainer({
  items,
  fetchNextPage,
  hasNextPage = false,
}: FeedScrollContainerProps) {
  const { height } = useWindowDimensions();

  const onEndReached = useCallback(() => {
    if (hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item: _item, index: _index }: { item: FeedListing; index: number }) => (
      <View style={{ height, width: "100%", backgroundColor: color("neutral.900") }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 14, color: color("neutral.500") }}>Reel</Text>
        </View>
      </View>
    ),
    [height]
  );

  const keyExtractor = useCallback((item: FeedListing) => item.id, []);

  const listEmptyComponent = useCallback(
    () => (
      <View
        style={{
          height,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: color("neutral.900"),
        }}
      >
        <Text style={{ fontSize: 14, color: color("neutral.500") }}>{FEED_EMPTY_MESSAGE}</Text>
      </View>
    ),
    [height]
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListEmptyComponent={listEmptyComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      pagingEnabled
      snapToInterval={height}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
    />
  );
}
