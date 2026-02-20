import { forwardRef, useCallback, useMemo } from "react";

import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";

import { FeedReelsProvider } from "packages/contexts/feedReels/FeedReelsContext";
import { useFeedReelsContext } from "packages/contexts/feedReels/useFeedReelsContext";
import { useFeedScrollContainer } from "packages/hooks/ui";
import type {
  FeedListing,
  FeedScrollController,
} from "packages/schemas/content/feed/feed";

import { ReelsCommentsSheet } from "@/features/feed/Reels/sheets/ReelsCommentsSheet";
import { ReelsMoreSheet } from "@/features/feed/Reels/sheets/ReelsMoreSheet";

import { FeedItemWithGesture } from "./FeedItemWithGesture";
import { ReelsItem, ReelsList, ReelsScroller } from "./ReelsVirtuosoComponents";

export type FeedScrollContainerProps = {
  items: FeedListing[];
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  virtuosoRef?: React.RefObject<VirtuosoHandle | null>;
  scrollControllerRef?: React.MutableRefObject<FeedScrollController | null>;
};

/** Spacer so last reel can scroll above tab bar on mobile. */
const ReelsFooter = () => (
  <div
    className="h-0 shrink-0 max-md:min-h-[var(--mobile-bottom-reserved)]"
    aria-hidden
  />
);

const ReelsScrollerWithContext = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ReelsScroller>
>((props, ref) => {
  const { isHorizontalGestureActive } = useFeedReelsContext();
  return (
    <ReelsScroller
      ref={ref}
      {...props}
      isHorizontalGestureActive={isHorizontalGestureActive}
    />
  );
});
ReelsScrollerWithContext.displayName = "ReelsScrollerWithContext";

export function FeedScrollContainer({
  items,
  fetchNextPage,
  hasNextPage = false,
  isFetchingNextPage = false,
  virtuosoRef,
  scrollControllerRef,
}: FeedScrollContainerProps) {
  const {
    ref,
    containerRef,
    viewportHeight,
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
    commentsForSheet,
    autoplayEnabled,
    handleLike,
    handleTogglePlayPause,
    handleReportSlideChange,
    handleReportVideoPlaying,
    handleRangeChanged,
    handleAtBottom,
    handleMoreCopyLink,
    handleMoreSave,
    handleAddComment,
    showReelsDebug,
    isVideoPlayingInReel,
  } = useFeedScrollContainer({
    items,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    virtuosoRef,
    scrollControllerRef,
  });

  const contextValue = useMemo(
    () => ({
      activeIndex,
      autoplayEnabled,
      slideIndexByReelIndex,
      likedIds,
      isHorizontalGestureActive,
      setCommentsSheetListingId,
      setMoreSheetListingId,
      setIsHorizontalGestureActive,
      handleLike,
      handleTogglePlayPause,
      handleReportSlideChange,
      handleReportVideoPlaying,
    }),
    [
      activeIndex,
      autoplayEnabled,
      slideIndexByReelIndex,
      likedIds,
      isHorizontalGestureActive,
      setCommentsSheetListingId,
      setMoreSheetListingId,
      setIsHorizontalGestureActive,
      handleLike,
      handleTogglePlayPause,
      handleReportSlideChange,
      handleReportVideoPlaying,
    ],
  );

  const itemContent = useCallback(
    (index: number, item: FeedListing) => (
      <FeedItemWithGesture
        key={item.id}
        item={
          item as FeedListing & { media: NonNullable<FeedListing["media"]> }
        }
        index={index}
      />
    ),
    [],
  );

  const virtuosoComponents = useMemo(
    () => ({
      List: ReelsList,
      Item: ReelsItem,
      Scroller: ReelsScrollerWithContext,
      Footer: ReelsFooter,
    }),
    [],
  );

  const atBottomStateChange = useCallback(
    (atBottom: boolean) => {
      if (atBottom) handleAtBottom();
    },
    [handleAtBottom],
  );

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      style={
        {
          "--reel-viewport-height":
            viewportHeight > 0 ? `${viewportHeight}px` : "100%",
        } as React.CSSProperties
      }
    >
      {showReelsDebug && (
        <div
          className="fixed left-2 top-2 z-50 rounded bg-black/80 px-2 py-1 font-mono text-xs text-white"
          aria-hidden
        >
          <div>reel: {activeIndex}</div>
          <div>slide: {slideIndexByReelIndex[activeIndex] ?? 0}</div>
          <div>gestureLock: {isHorizontalGestureActive ? "on" : "off"}</div>
          <div>videoPlaying: {isVideoPlayingInReel ? "yes" : "no"}</div>
        </div>
      )}
      <FeedReelsProvider value={contextValue}>
        <Virtuoso
          ref={ref as React.Ref<VirtuosoHandle>}
          data={items}
          style={{ height: "100%", width: "100%" }}
          components={virtuosoComponents}
          initialTopMostItemIndex={initialIndex}
          fixedItemHeight={viewportHeight}
          increaseViewportBy={{ top: 200, bottom: 200 }}
          itemContent={itemContent}
          rangeChanged={handleRangeChanged}
          atBottomStateChange={atBottomStateChange}
        />
      </FeedReelsProvider>
      <ReelsCommentsSheet
        isOpen={commentsSheetListingId !== null}
        onClose={() => setCommentsSheetListingId(null)}
        item={commentsSheetItem}
        comments={commentsForSheet}
        onAddComment={
          commentsSheetListingId
            ? (text) => handleAddComment(commentsSheetListingId, text)
            : undefined
        }
      />
      <ReelsMoreSheet
        isOpen={moreSheetListingId !== null}
        onClose={() => setMoreSheetListingId(null)}
        item={moreSheetItem}
        isSaved={moreSheetItem ? likedIds.has(moreSheetItem.id) : false}
        onCopyLink={handleMoreCopyLink}
        onSave={handleMoreSave}
      />
    </div>
  );
}
