import { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@ui/icons";

import { useFeedReelsContext } from "packages/features/feed/hooks/feedReels/useFeedReelsContext";
import { useFeedAxisLock, useFeedGestureTrap } from "packages/hooks/ui";

import { Button, Region } from "@/components/ui";
import type { MediaCarouselRef } from "@/features/feed/components/carousel/MediaCarousel";
import { MediaCarousel } from "@/features/feed/components/carousel/MediaCarousel";
import { BottomInfo } from "@/features/feed/components/Overlay/BottomInfo";
import { FeedActionStack } from "@/features/feed/components/Overlay/FeedActionStack";
import type { FeedListing } from "@/features/feed/types/feed";
export type FeedItemWithGestureProps = {
  item: FeedListing & {
    media: NonNullable<FeedListing["media"]>;
  };
  index: number;
};
export function FeedItemWithGesture({ item, index }: FeedItemWithGestureProps) {
  const {
    activeIndex,
    autoplayEnabled: _autoplayEnabled,
    likedIds,
    likesByHomeId,
    slideIndexByReelIndex,
    isHorizontalGestureActive = false,
    setCommentsSheetListingId,
    setMoreSheetListingId,
    setIsHorizontalGestureActive,
    handleLike,
    handleTogglePlayPause,
    handleReportSlideChange,
    handleReportVideoPlaying,
  } = useFeedReelsContext();
  const isLiked = likesByHomeId?.[item.id]?.isLikedByMe ?? likedIds.has(item.id);
  const currentSlideIndex = slideIndexByReelIndex[index] ?? 0;
  const totalSlides = item.media?.length ?? 0;
  const onLike = useCallback(() => handleLike(item.id), [handleLike, item.id]);
  const onComment = useCallback(
    () => setCommentsSheetListingId(item.id),
    [setCommentsSheetListingId, item.id]
  );
  const onMore = useCallback(
    () => setMoreSheetListingId(item.id),
    [setMoreSheetListingId, item.id]
  );
  const onGestureLock = setIsHorizontalGestureActive;
  const onReportSlideChange = useCallback(
    (reelIndex: number, slideIndex: number) => handleReportSlideChange(reelIndex, slideIndex),
    [handleReportSlideChange]
  );
  const onReportVideoPlaying = useCallback(
    (reelIndex: number, playing: boolean) => handleReportVideoPlaying(reelIndex, playing),
    [handleReportVideoPlaying]
  );
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const heartBurstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaCarouselRef = useRef<MediaCarouselRef>(null);
  const handleDoubleTap = useCallback(() => {
    onLike();
    setShowHeartBurst(true);
    if (heartBurstTimeoutRef.current) clearTimeout(heartBurstTimeoutRef.current);
    heartBurstTimeoutRef.current = setTimeout(() => {
      setShowHeartBurst(false);
      heartBurstTimeoutRef.current = null;
    }, 600);
  }, [onLike]);
  useEffect(() => {
    return () => {
      if (heartBurstTimeoutRef.current) {
        clearTimeout(heartBurstTimeoutRef.current);
      }
    };
  }, []);
  const { onTap } = useFeedGestureTrap({
    onSingleTap: handleTogglePlayPause,
    onDoubleTap: handleDoubleTap,
  });
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useFeedAxisLock({
    onLockChange: onGestureLock,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const isReelActive = index === activeIndex;
  const isVisible = Math.abs(index - activeIndex) <= 1;
  return (
    <div
      ref={containerRef}
      className="relative box-border flex w-full shrink-0 items-center justify-center"
      style={{
        height: "var(--reel-viewport-height, 100%)",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={(e) => handleTouchMove(e, containerRef)}
      onTouchEnd={() => handleTouchEnd(containerRef)}
      onTouchCancel={() => handleTouchEnd(containerRef)}
    >
      <div className="relative flex h-full w-full max-w-md items-center justify-center md:max-w-[56.25dvh]">
        <div className="pointer-events-none absolute inset-0 z-10" aria-hidden />
        {showHeartBurst && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            aria-hidden
          >
            <Icon
              name="heart"
              className="animate-heart-burst h-24 w-24 shrink-0 fill-red-500 text-red-500"
              strokeWidth={1.5}
            />
          </div>
        )}
        <div className="relative flex h-full w-full flex-col">
          <MediaCarousel
            ref={mediaCarouselRef}
            media={item.media}
            isReelActive={isReelActive}
            isVisible={isVisible}
            hideSlideIndicator
            onGestureLock={onGestureLock}
            gestureLockedToHorizontal={isHorizontalGestureActive}
            onTap={onTap}
            onSlideChange={(slideIndex) => onReportSlideChange?.(index, slideIndex)}
            onVideoPlayingChange={(playing) => onReportVideoPlaying?.(index, playing)}
          />
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex min-h-28 items-end justify-between gap-2 px-2 pb-3 max-md:[bottom:var(--mobile-bottom-reserved)] md:pb-4">
          <div className="pointer-events-auto min-w-0 flex-1 overflow-hidden">
            <BottomInfo item={item} embedded />
          </div>
          {totalSlides > 1 && (
            <Region
              label={`Slide ${currentSlideIndex + 1} of ${totalSlides}`}
              className="pointer-events-auto absolute bottom-0 left-1/2 flex -translate-x-1/2 items-end justify-center gap-1.5 pb-7 md:pb-8"
            >
              {Array.from({ length: totalSlides }, (_, i) => (
                <Button
                  key={i}
                  type="button"
                  onClick={() => mediaCarouselRef.current?.scrollToSlide(i)}
                  variant="ghost"
                  size="xs"
                  rounded="full"
                  className="!h-1.5 !max-h-1.5 !min-h-1.5 !w-1.5 !min-w-1.5 !max-w-1.5 shrink-0 !p-0 hover:bg-transparent focus:ring-white focus:ring-offset-transparent"
                  style={{
                    backgroundColor:
                      i === currentSlideIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                  }}
                  aria-current={i === currentSlideIndex ? "true" : undefined}
                  label={`Go to slide ${i + 1}`}
                />
              ))}
            </Region>
          )}
          <div className="pointer-events-auto flex shrink-0 items-end">
            <FeedActionStack
              item={item}
              isLiked={isLiked}
              onLike={onLike}
              onComment={onComment}
              onMore={onMore}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
