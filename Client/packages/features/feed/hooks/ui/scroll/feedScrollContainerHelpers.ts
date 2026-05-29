import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { VirtuosoHandle } from "react-virtuoso";

import { useSecureClipboardCopy } from "packages/hooks/ui/clipboard";
import { ROUTES } from "packages/navigation";
import { dateNow } from "packages/utils/date";
import { getWindow } from "packages/utils/platform";

import type { FeedComment, FeedListing, FeedScrollController } from "@/features/feed/types/feed";
import { schedulePreload } from "@/features/feed/utils";

/**
 * Apply range change: update active index, preload. No URL sync.
 * Extracted to satisfy max-lines-per-function in useFeedScrollContainer.
 */
export function applyRangeChanged(
  range: { startIndex: number; endIndex: number },
  items: FeedListing[],
  setActiveIndex: (v: number | ((p: number) => number)) => void,
  setIsVideoPlayingInReel: (v: boolean) => void,
  setUserPaused: (paused: boolean) => void
) {
  const idx = range.startIndex;
  setActiveIndex((prev) => (prev === idx ? prev : idx));
  setIsVideoPlayingInReel(false);
  setUserPaused(false);
  schedulePreload(
    items.map((i) => ({ id: i.id, thumbnailUrl: i.thumbnailUrl })),
    idx
  );
}

/**
 * Create a new feed comment and append to state.
 * Extracted to satisfy max-lines-per-function in useFeedScrollContainer.
 */
export function createFeedCommentAndAppend(
  listingId: string,
  text: string,
  setCommentsByListingId: (
    fn: (prev: Record<string, FeedComment[]>) => Record<string, FeedComment[]>
  ) => void
) {
  const newComment: FeedComment = {
    id: crypto.randomUUID(),
    user: { id: "current", name: "You", avatarUrl: undefined },
    text,
    createdAt: dateNow().toISOString(),
    likes: 0,
  };
  setCommentsByListingId((prev) => ({
    ...prev,
    [listingId]: [...(prev[listingId] ?? []), newComment],
  }));
}

/**
 * Manages viewport height from container element (ResizeObserver).
 * Extracted to satisfy max-lines-per-function in useFeedScrollContainer.
 */
export function useFeedScrollViewport(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [viewportHeight, setViewportHeight] = useState(() => {
    const win = getWindow();
    return win ? win.innerHeight : 0;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0;
      if (height > 0) setViewportHeight(height);
    });
    ro.observe(el);
    if (el.clientHeight > 0) setViewportHeight(el.clientHeight);
    return () => ro.disconnect();
  }, [containerRef]);

  return viewportHeight;
}

/**
 * Scrolls to initial index once when items/initialIndex are ready.
 * Extracted to satisfy max-lines-per-function in useFeedScrollContainer.
 */
/**
 * Keeps scrollControllerRef in sync with current index and scrollToIndex.
 * Extracted to satisfy max-lines-per-function in useFeedScrollContainer.
 */
export function useFeedScrollControllerEffect(
  activeIndex: number,
  scrollToIndex: (index: number) => void,
  itemCount: number,
  scrollControllerRef: React.MutableRefObject<FeedScrollController | null> | undefined
) {
  useEffect(() => {
    if (scrollControllerRef) {
      scrollControllerRef.current = {
        currentIndex: activeIndex,
        scrollToIndex,
        itemCount,
      };
    }
  }, [activeIndex, scrollToIndex, itemCount, scrollControllerRef]);
}

export function useFeedScrollSheetAndMore(
  items: FeedListing[],
  commentsSheetListingId: string | null,
  moreSheetListingId: string | null,
  commentsByListingId: Record<string, FeedComment[]>,
  setLikedIds: React.Dispatch<React.SetStateAction<Set<string>>>
) {
  const commentsSheetItem = useMemo(
    () => items.find((i) => i.id === commentsSheetListingId) ?? null,
    [items, commentsSheetListingId]
  );
  const moreSheetItem = useMemo(
    () => items.find((i) => i.id === moreSheetListingId) ?? null,
    [items, moreSheetListingId]
  );
  const commentsForSheet = commentsSheetListingId
    ? (commentsByListingId[commentsSheetListingId] ?? [])
    : [];

  const copyToClipboard = useSecureClipboardCopy();
  const getSearchPageShareUrl = useCallback(() => {
    const win = getWindow();
    const base = win ? win.location.origin : "";
    return `${base}${ROUTES.SEARCH}`;
  }, []);

  const handleMoreCopyLink = useCallback(() => {
    if (!moreSheetListingId) return;
    void copyToClipboard(getSearchPageShareUrl());
  }, [moreSheetListingId, copyToClipboard, getSearchPageShareUrl]);

  const handleMoreSave = useCallback(() => {
    if (!moreSheetListingId) return;
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(moreSheetListingId)) next.delete(moreSheetListingId);
      else next.add(moreSheetListingId);
      return next;
    });
  }, [moreSheetListingId, setLikedIds]);

  return {
    commentsSheetItem,
    moreSheetItem,
    commentsForSheet,
    handleMoreCopyLink,
    handleMoreSave,
  };
}

export function useFeedScrollToInitial(
  items: { id: string; thumbnailUrl?: string }[],
  initialIndex: number,
  ref: React.RefObject<VirtuosoHandle | null>,
  setActiveIndex: (index: number | ((prev: number) => number)) => void
) {
  const hasScrolledToInitial = useRef(false);

  useEffect(() => {
    if (items.length > 0 && initialIndex >= 0 && !hasScrolledToInitial.current) {
      hasScrolledToInitial.current = true;
      setActiveIndex(initialIndex);
      schedulePreload(
        items.map((i) => ({ id: i.id, thumbnailUrl: i.thumbnailUrl })),
        initialIndex
      );
      const id = requestAnimationFrame(() => {
        ref.current?.scrollToIndex({ index: initialIndex, behavior: "auto" });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [items, initialIndex, ref, setActiveIndex]);
}
