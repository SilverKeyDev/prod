import { forwardRef, useCallback, useMemo } from "react";

import { useFeedComments } from "packages/features/feed/hooks/data/useFeedComments";
import { useFeedLikes } from "packages/features/feed/hooks/data/useFeedLikes";
import { FeedReelsProvider } from "packages/features/feed/hooks/feedReels/FeedReelsContext";
import { useFeedReelsContext } from "packages/features/feed/hooks/feedReels/useFeedReelsContext";
import { useFeedScrollContainer } from "packages/hooks/ui";
import { Virtuoso, type VirtuosoHandle } from "packages/ui/components/adapters/virtuoso";

import { ReelsCommentsSheet } from "@/features/feed/components/Reels/sheets/ReelsCommentsSheet";
import { ReelsMoreSheet } from "@/features/feed/components/Reels/sheets/ReelsMoreSheet";
import type { FeedListing } from "@/features/feed/types/feed";

import { FeedItemWithGesture } from "./FeedItemWithGesture";
import type { FeedScrollContainerProps } from "./FeedScrollContainerTypes";
import { ReelsItem, ReelsList, ReelsScroller } from "./ReelsVirtuosoComponents";

/** Spacer so last reel can scroll above tab bar on mobile. */
const ReelsFooter = () => (
  <div className="h-0 shrink-0 max-md:min-h-[var(--mobile-bottom-reserved)]" aria-hidden />
);

const ReelsScrollerWithContext = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ReelsScroller>
>((props, ref) => {
  const { isHorizontalGestureActive } = useFeedReelsContext();
  return (
    <ReelsScroller ref={ref} {...props} isHorizontalGestureActive={isHorizontalGestureActive} />
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
    handleLike: _localHandleLike,
    handleTogglePlayPause,
    handleReportSlideChange,
    handleReportVideoPlaying,
    handleRangeChanged,
    handleAtBottom,
    handleMoreCopyLink,
    handleMoreSave,
    handleAddComment: _localHandleAddComment,
  } = useFeedScrollContainer({
    items,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    virtuosoRef: virtuosoRef as React.RefObject<VirtuosoHandle | null>,
    scrollControllerRef,
  });

  const homeIds = useMemo(() => items.map((i) => i.id), [items]);
  const { likesByHomeId, toggleLike } = useFeedLikes(homeIds);
  const commentsHook = useFeedComments(commentsSheetListingId, commentsSheetListingId !== null);
  const sheetComments = commentsSheetListingId ? commentsHook.comments : commentsForSheet;
  const sheetOnAddComment = commentsSheetListingId
    ? (text: string) => commentsHook.addComment(text)
    : undefined;

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

  const itemContent = useCallback(
    (index: number, item: FeedListing) => (
      <FeedItemWithGesture
        key={item.id}
        item={item as FeedListing & { media: NonNullable<FeedListing["media"]> }}
        index={index}
      />
    ),
    []
  );

  const virtuosoComponents = useMemo(
    () => ({
      List: ReelsList,
      Item: ReelsItem,
      Scroller: ReelsScrollerWithContext,
      Footer: ReelsFooter,
    }),
    []
  );

  const atBottomStateChange = useCallback(
    (atBottom: boolean) => {
      if (atBottom) handleAtBottom();
    },
    [handleAtBottom]
  );

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      style={
        {
          "--reel-viewport-height": viewportHeight > 0 ? `${viewportHeight}px` : "100%",
        } as React.CSSProperties
      }
    >
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
        comments={sheetComments}
        onAddComment={sheetOnAddComment}
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
