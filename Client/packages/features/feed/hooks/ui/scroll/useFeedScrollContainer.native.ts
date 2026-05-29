import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { FlatList } from "react-native";
import { useWindowDimensions } from "react-native";

import { useSecureClipboardCopy } from "packages/hooks/ui/clipboard";
import { ROUTES } from "packages/navigation";
import { useSearchContextStore } from "packages/store";
import { useFeedStore } from "packages/store";

import type { FeedListing, FeedScrollController } from "@/features/feed/types/feed";
import { schedulePreload } from "@/features/feed/utils";

export type UseFeedScrollContainerParams = {
  items: FeedListing[];
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  scrollControllerRef?: React.MutableRefObject<FeedScrollController | null>;
  /** Optional FlatList ref for imperative scroll; created internally if omitted. */
  flatListRef?: React.RefObject<FlatList<FeedListing> | null>;
};

export function useFeedScrollContainer({
  items,
  fetchNextPage,
  hasNextPage = false,
  isFetchingNextPage = false,
  scrollControllerRef,
  flatListRef: externalFlatListRef,
}: UseFeedScrollContainerParams) {
  const { height: viewportHeight } = useWindowDimensions();
  const anchorListingId = useSearchContextStore((s) => s.anchor.listingId);

  const internalFlatListRef = useRef<FlatList<FeedListing> | null>(null);
  const flatListRef = externalFlatListRef ?? internalFlatListRef;

  const initialIndex = useMemo(() => {
    if (!anchorListingId || items.length === 0) return 0;
    const idx = items.findIndex((i) => i.id === anchorListingId);
    return idx >= 0 ? idx : 0;
  }, [anchorListingId, items]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isHorizontalGestureActive, setIsHorizontalGestureActive] = useState(false);
  const [slideIndexByReelIndex, setSlideIndexByReelIndex] = useState<Record<number, number>>({});
  const [isVideoPlayingInReel, setIsVideoPlayingInReel] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [commentsSheetListingId, setCommentsSheetListingId] = useState<string | null>(null);
  const [moreSheetListingId, setMoreSheetListingId] = useState<string | null>(null);

  const autoplayEnabled = useFeedStore((s) => s.autoplayEnabled);
  const userPaused = useFeedStore((s) => s.userPaused);
  const setUserPaused = useFeedStore((s) => s.setUserPaused);

  const copyToClipboard = useSecureClipboardCopy();

  const handleLike = useCallback((itemId: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const handleTogglePlayPause = useCallback(() => {
    setUserPaused(!userPaused);
  }, [setUserPaused, userPaused]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, items.length - 1));
      setActiveIndex(clamped);
      setIsVideoPlayingInReel(false);
      setUserPaused(false);
      schedulePreload(
        items.map((i) => ({ id: i.id, thumbnailUrl: i.thumbnailUrl })),
        clamped
      );
      flatListRef.current?.scrollToIndex({ index: clamped, animated: true });
    },
    [flatListRef, items, setUserPaused]
  );

  useEffect(() => {
    if (!scrollControllerRef) return;
    scrollControllerRef.current = {
      currentIndex: activeIndex,
      scrollToIndex,
      itemCount: items.length,
    };
  }, [activeIndex, items.length, scrollControllerRef, scrollToIndex]);

  // Initial scroll once when items arrive
  const hasScrolledToInitialRef = useRef(false);
  useEffect(() => {
    if (items.length === 0) return;
    if (initialIndex < 0) return;
    if (hasScrolledToInitialRef.current) return;
    hasScrolledToInitialRef.current = true;
    setActiveIndex(initialIndex);
    schedulePreload(
      items.map((i) => ({ id: i.id, thumbnailUrl: i.thumbnailUrl })),
      initialIndex
    );
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    });
  }, [flatListRef, initialIndex, items]);

  const handleReportSlideChange = useCallback((reelIndex: number, slideIndex: number) => {
    setSlideIndexByReelIndex((prev) =>
      prev[reelIndex] === slideIndex ? prev : { ...prev, [reelIndex]: slideIndex }
    );
  }, []);

  const handleReportVideoPlaying = useCallback(
    (reelIndex: number, playing: boolean) => {
      if (reelIndex === activeIndex) setIsVideoPlayingInReel(playing);
    },
    [activeIndex]
  );

  const handleRangeChanged = useCallback(
    (range: { startIndex: number; endIndex: number }) => {
      const idx = range.startIndex;
      setActiveIndex((prev) => (prev === idx ? prev : idx));
      setIsVideoPlayingInReel(false);
      setUserPaused(false);
      schedulePreload(
        items.map((i) => ({ id: i.id, thumbnailUrl: i.thumbnailUrl })),
        idx
      );
    },
    [items, setUserPaused]
  );

  const handleAtBottom = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleMoreCopyLink = useCallback(() => {
    // On native we don't have window.origin; copy a route path for now (deep links can map later).
    void copyToClipboard(ROUTES.SEARCH);
  }, [copyToClipboard]);

  const handleMoreSave = useCallback(() => {
    if (!moreSheetListingId) return;
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(moreSheetListingId)) next.delete(moreSheetListingId);
      else next.add(moreSheetListingId);
      return next;
    });
  }, [moreSheetListingId]);

  const commentsSheetItem = useMemo(
    () => items.find((i) => i.id === commentsSheetListingId) ?? null,
    [items, commentsSheetListingId]
  );
  const moreSheetItem = useMemo(
    () => items.find((i) => i.id === moreSheetListingId) ?? null,
    [items, moreSheetListingId]
  );

  return {
    flatListRef,
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
    isVideoPlayingInReel,
  };
}
