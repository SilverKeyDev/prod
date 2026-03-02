import { useCallback } from "react";

import { FlatList, useWindowDimensions, View } from "react-native";

import { color } from "packages/design-tokens";

import type { FeedListing } from "@/features/feed/types/feed";

import type { FeedScrollContainerProps } from "./FeedScrollContainerTypes";

/**
 * Native: FlatList with same data/onEndReached as web Virtuoso.
 * Full reel UI (FeedItemWithGesture) can be wired when feed item has a native variant.
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
      <View style={{ height, width: "100%" }}>
        {/* Placeholder until FeedItemWithGesture.native exists */}
        <View
          style={{ flex: 1, backgroundColor: color("neutral.900"), justifyContent: "center" }}
        />
      </View>
    ),
    [height]
  );

  const keyExtractor = useCallback((item: FeedListing) => item.id, []);

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
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
