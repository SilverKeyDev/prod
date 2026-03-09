import { useCallback, useMemo, useRef } from "react";

import type { ViewToken } from "react-native";
import { FlatList, useWindowDimensions, View } from "react-native";

import { color } from "packages/design-tokens";
import { useFeedComments } from "packages/features/feed/hooks/data/useFeedComments";
import { useFeedLikes } from "packages/features/feed/hooks/data/useFeedLikes";
import { FeedReelsProvider } from "packages/features/feed/hooks/feedReels/FeedReelsContext";
import { useFeedScrollContainer } from "packages/hooks/ui";
import { Text } from "packages/ui/components/primitives";

import { ReelsCommentsSheet } from "@/features/feed/components/Reels/sheets/ReelsCommentsSheet";
import { ReelsMoreSheet } from "@/features/feed/components/Reels/sheets/ReelsMoreSheet";
import type { FeedListing } from "@/features/feed/types/feed";

import { FeedItemWithGesture } from "./FeedItemWithGesture";
import type { FeedScrollContainerProps } from "./FeedScrollContainerTypes";

/** Empty state copy when feed has no reels (shared intent with web). */
const FEED_EMPTY_MESSAGE = "No reels right now. Check back later.";

/**
 * Native: FlatList Reels feed. Mirrors web behavior:
 * - full-screen paging
 * - active index tracking + preload scheduling (hook)
 * - likes via API (hook)
 */
export function FeedScrollContainer({
  items,
  fetchNextPage,
  hasNextPage = false,
  isFetchingNextPage = false,
  scrollControllerRef,
}: FeedScrollContainerProps) {
  const { height } = useWindowDimensions();

  const {
    flatListRef,
    activeIndex,
    initialIndex,
    isHorizontalGestureActive,
    setIsHorizontalGestureActive,
    slideIndexByReelIndex,
    likedIds,
    commentsSheetListingId,
    setCommentsSheetListingId,
    moreSheetListingId,
    setMoreSheetListingId,
    commentsSheetItem,
    moreSheetItem,
    autoplayEnabled,
    handleMoreCopyLink,
    handleMoreSave,
    handleTogglePlayPause,
    handleReportSlideChange,
    handleReportVideoPlaying,
    handleRangeChanged,
    handleAtBottom,
  } = useFeedScrollContainer({
    items,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    scrollControllerRef,
  });

  const homeIds = useMemo(() => items.map((i) => i.id), [items]);
  const { likesByHomeId, toggleLike } = useFeedLikes(homeIds);
  const commentsHook = useFeedComments(commentsSheetListingId, commentsSheetListingId !== null);

  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 50,
  });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const first = viewableItems.find((v) => v.isViewable && typeof v.index === "number");
      const idx = typeof first?.index === "number" ? first.index : null;
      if (idx == null) return;
      handleRangeChanged({ startIndex: idx, endIndex: idx });
    },
    [handleRangeChanged]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: FeedListing; index: number }) => (
      <View style={{ height, width: "100%", backgroundColor: color("neutral.900") }}>
        <FeedItemWithGesture
          item={item as FeedListing & { media: NonNullable<FeedListing["media"]> }}
          index={index}
        />
      </View>
    ),
    [height]
  );

  const keyExtractor = useCallback((item: FeedListing) => item.id, []);

  const contextValue = useMemo(
    () => ({
      activeIndex,
      autoplayEnabled,
      slideIndexByReelIndex,
      likedIds,
      likesByHomeId,
      isHorizontalGestureActive,
      setCommentsSheetListingId,
      setMoreSheetListingId,
      setIsHorizontalGestureActive,
      handleLike: toggleLike,
      handleTogglePlayPause,
      handleReportSlideChange,
      handleReportVideoPlaying,
    }),
    [
      activeIndex,
      autoplayEnabled,
      slideIndexByReelIndex,
      likedIds,
      likesByHomeId,
      isHorizontalGestureActive,
      setCommentsSheetListingId,
      setMoreSheetListingId,
      setIsHorizontalGestureActive,
      toggleLike,
      handleTogglePlayPause,
      handleReportSlideChange,
      handleReportVideoPlaying,
    ]
  );

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
    <FeedReelsProvider value={contextValue}>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={listEmptyComponent}
        pagingEnabled
        scrollEnabled={!isHorizontalGestureActive}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onEndReached={() => handleAtBottom()}
        onEndReachedThreshold={0.5}
        viewabilityConfig={viewabilityConfigRef.current}
        onViewableItemsChanged={onViewableItemsChanged}
        initialScrollIndex={items.length > 0 ? initialIndex : undefined}
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews
      />
      <ReelsCommentsSheet
        isOpen={commentsSheetListingId !== null}
        onClose={() => setCommentsSheetListingId(null)}
        item={commentsSheetItem}
        comments={commentsHook.comments}
        onAddComment={(text) => commentsHook.addComment(text)}
      />
      <ReelsMoreSheet
        isOpen={moreSheetListingId !== null}
        onClose={() => setMoreSheetListingId(null)}
        item={moreSheetItem}
        isSaved={
          moreSheetItem
            ? (likesByHomeId?.[moreSheetItem.id]?.isLikedByMe ?? likedIds.has(moreSheetItem.id))
            : false
        }
        onCopyLink={handleMoreCopyLink}
        onSave={handleMoreSave}
      />
    </FeedReelsProvider>
  );
}
