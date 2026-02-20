import { useCallback, useMemo, useRef, useState } from "react";

import type { VirtuosoHandle } from "react-virtuoso";

import { useNavigation } from "packages/navigation";
import type {
  FeedComment,
  FeedListing,
  FeedScrollController,
} from "packages/schemas/content/feed/feed";
import { useSearchContextStore } from "packages/store";
import { useFeedStore } from "packages/store";
import { getWindow } from "packages/utils/core/platform";

import {
  applyRangeChanged,
  createFeedCommentAndAppend,
  useFeedScrollControllerEffect,
  useFeedScrollSheetAndMore,
  useFeedScrollToInitial,
  useFeedScrollViewport,
} from "./feedScrollContainerHelpers";

const FEED_PARAM = "feed";

export type UseFeedScrollContainerParams = {
  items: FeedListing[];
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  virtuosoRef?: React.RefObject<VirtuosoHandle | null>;
  scrollControllerRef?: React.MutableRefObject<FeedScrollController | null>;
};

export function useFeedScrollContainer({
  items,
  fetchNextPage,
  hasNextPage = false,
  isFetchingNextPage = false,
  virtuosoRef: externalRef,
  scrollControllerRef,
}: UseFeedScrollContainerParams) {
  const { getSearchParams, setSearchParams } = useNavigation();
  const searchParams = getSearchParams();
  const anchorListingId = useSearchContextStore((s) => s.anchor.listingId);
  const internalRef = useRef<VirtuosoHandle>(null);
  const ref = externalRef ?? internalRef;
  const feedIdFromUrl = searchParams.get(FEED_PARAM);
  // Use only anchor (from search context) for initial scroll, not feed URL param.
  // This keeps the root reel (index 0) at the top when first opening reels.
  const initialIndex = useMemo(() => {
    if (!anchorListingId || items.length === 0) return 0;
    const idx = items.findIndex((i) => i.id === anchorListingId);
    return idx >= 0 ? idx : 0;
  }, [anchorListingId, items]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isHorizontalGestureActive, setIsHorizontalGestureActive] =
    useState(false);
  const [slideIndexByReelIndex, setSlideIndexByReelIndex] = useState<
    Record<number, number>
  >({});
  const [isVideoPlayingInReel, setIsVideoPlayingInReel] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [commentsSheetListingId, setCommentsSheetListingId] = useState<
    string | null
  >(null);
  const [moreSheetListingId, setMoreSheetListingId] = useState<string | null>(
    null,
  );
  const [commentsByListingId, setCommentsByListingId] = useState<
    Record<string, FeedComment[]>
  >({});
  const autoplayEnabled = useFeedStore((s) => s.autoplayEnabled);
  const containerRef = useRef<HTMLDivElement>(null);

  const viewportHeight = useFeedScrollViewport(containerRef);
  useFeedScrollToInitial(items, initialIndex, ref, setActiveIndex);

  const handleLike = useCallback((itemId: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const handleTogglePlayPause = useCallback(() => {
    getWindow()?.dispatchEvent(new CustomEvent("reels-space-press"));
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, items.length - 1));
      setActiveIndex(clamped);
      ref.current?.scrollToIndex({ index: clamped, behavior: "smooth" });
    },
    [items.length, ref],
  );

  useFeedScrollControllerEffect(
    activeIndex,
    scrollToIndex,
    items.length,
    scrollControllerRef,
  );

  const handleReportSlideChange = useCallback(
    (reelIndex: number, slideIndex: number) => {
      setSlideIndexByReelIndex((prev) =>
        prev[reelIndex] === slideIndex
          ? prev
          : { ...prev, [reelIndex]: slideIndex },
      );
    },
    [],
  );
  const handleReportVideoPlaying = useCallback(
    (reelIndex: number, playing: boolean) => {
      if (reelIndex === activeIndex) setIsVideoPlayingInReel(playing);
    },
    [activeIndex],
  );

  const handleRangeChanged = useCallback(
    (range: { startIndex: number; endIndex: number }) =>
      applyRangeChanged(
        range,
        items,
        setActiveIndex,
        setIsVideoPlayingInReel,
        setSearchParams,
        feedIdFromUrl,
        initialIndex,
      ),
    [items, setSearchParams, feedIdFromUrl, initialIndex],
  );

  const handleAtBottom = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const {
    commentsSheetItem,
    moreSheetItem,
    commentsForSheet,
    handleMoreCopyLink,
    handleMoreSave,
  } = useFeedScrollSheetAndMore(
    items,
    commentsSheetListingId,
    moreSheetListingId,
    commentsByListingId,
    setLikedIds,
  );

  const handleAddComment = useCallback(
    (listingId: string, text: string) =>
      createFeedCommentAndAppend(listingId, text, setCommentsByListingId),
    [],
  );

  const showReelsDebug = searchParams.get("reelsDebug") === "1";

  return {
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
    items,
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
  };
}
