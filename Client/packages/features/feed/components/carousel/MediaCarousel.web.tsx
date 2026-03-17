import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

import { spacing } from "packages/design-tokens";
import { useHlsVideo } from "packages/hooks/ui";
import { useMediaQuery } from "packages/hooks/ui";
import { useFeedStore } from "packages/store";
import { useEmblaCarousel } from "packages/ui/components/adapters/carousel";
import { Box } from "packages/ui/components/primitives";

import { Button, Image, Region, Video } from "@/components/ui";
import {
  DEFAULT_PLACEHOLDER_IMAGE,
  DRAG_THRESHOLD_LARGE,
  DRAG_THRESHOLD_SMALL,
  isLowDataMode,
  LARGE_SCREEN_MEDIA,
  preloadPoster,
  TAP_MOVE_THRESHOLD_PX,
  WHEEL_TRAVERSAL_COOLDOWN_MS,
} from "@/features/feed/utils";

import type { MediaCarouselProps, MediaCarouselRef } from "./MediaCarouselTypes";

export type { MediaCarouselProps, MediaCarouselRef } from "./MediaCarouselTypes";

/**
 * Full-screen horizontal carousel for a single reel (web: Embla).
 */
export const MediaCarousel = forwardRef<MediaCarouselRef, MediaCarouselProps>(
  function MediaCarousel(
    {
      media,
      isReelActive,
      isVisible,
      onSlideChange,
      onGestureLock,
      gestureLockedToHorizontal = false,
      onVideoPlayingChange,
      hideSlideIndicator = false,
      onTap,
      className,
    },
    ref
  ) {
    const isLargeScreen = useMediaQuery(LARGE_SCREEN_MEDIA);
    const dragThreshold = isLargeScreen ? DRAG_THRESHOLD_LARGE : DRAG_THRESHOLD_SMALL;
    const [emblaRef, emblaApi] = useEmblaCarousel({
      axis: "x",
      align: "start",
      containScroll: "trimSnaps",
      dragFree: false,
      loop: false,
      dragThreshold,
    });

    const [selectedIndex, setSelectedIndex] = useState(0);
    const activeVideoRef = useRef<HTMLVideoElement | null>(null);
    const userPaused = useFeedStore((s) => s.userPaused);
    const autoplayEnabled = useFeedStore((s) => s.autoplayEnabled);

    const onSlideChangeRef = useRef(onSlideChange);
    onSlideChangeRef.current = onSlideChange;
    const onVideoPlayingChangeRef = useRef(onVideoPlayingChange);
    onVideoPlayingChangeRef.current = onVideoPlayingChange;
    const lastReportedIndexRef = useRef<number | null>(null);
    const lastReportedPlayingRef = useRef<boolean | null>(null);

    useEffect(() => {
      if (!emblaApi) return;
      const onSelect = () => {
        const idx = emblaApi.selectedScrollSnap();
        setSelectedIndex((prev) => (prev === idx ? prev : idx));
        if (lastReportedIndexRef.current !== idx) {
          lastReportedIndexRef.current = idx;
          onSlideChangeRef.current?.(idx);
        }
      };
      const idx = emblaApi.selectedScrollSnap();
      setSelectedIndex((prev) => (prev === idx ? prev : idx));
      if (lastReportedIndexRef.current !== idx) {
        lastReportedIndexRef.current = idx;
        const report = onSlideChangeRef.current;
        if (report) queueMicrotask(() => report(idx));
      }
      emblaApi.on("select", onSelect);
      return () => {
        lastReportedIndexRef.current = null;
        emblaApi.off("select", onSelect);
      };
    }, [emblaApi]);

    const activeItem = media[selectedIndex];
    const isActiveSlideVideo = activeItem?.type === "video";
    const shouldPlay = isReelActive && isActiveSlideVideo && autoplayEnabled && !userPaused;

    const activeVideoUrl =
      isActiveSlideVideo && activeItem.type === "video" ? activeItem.src : undefined;
    const isOnDeck = selectedIndex + 1 < media.length && media[selectedIndex + 1]?.type === "video";

    useHlsVideo({
      videoRef: activeVideoRef,
      url: activeVideoUrl,
      isActive: isReelActive && isActiveSlideVideo,
      isNext: isOnDeck,
      enabled: Boolean(activeVideoUrl) && isVisible && !isLowDataMode(),
    });

    useEffect(() => {
      if (shouldPlay && activeVideoRef.current) {
        void activeVideoRef.current.play().catch(() => {});
        if (lastReportedPlayingRef.current !== true) {
          lastReportedPlayingRef.current = true;
          onVideoPlayingChangeRef.current?.(true);
        }
      } else {
        if (activeVideoRef.current) activeVideoRef.current.pause();
        if (lastReportedPlayingRef.current !== false) {
          lastReportedPlayingRef.current = false;
          onVideoPlayingChangeRef.current?.(false);
        }
      }
    }, [shouldPlay]);

    useEffect(() => {
      if (!isReelActive) {
        if (activeVideoRef.current) activeVideoRef.current.pause();
        if (lastReportedPlayingRef.current !== false) {
          lastReportedPlayingRef.current = false;
          onVideoPlayingChangeRef.current?.(false);
        }
      }
    }, [isReelActive]);

    useEffect(() => {
      const next = media[selectedIndex + 1];
      if (next?.type === "image") {
        preloadPoster(next.src);
      }
    }, [media, selectedIndex]);

    const handlePointerUp = useCallback(() => {
      onGestureLock?.(false);
    }, [onGestureLock]);

    const handlePointerLeave = useCallback(() => {
      onGestureLock?.(false);
    }, [onGestureLock]);

    const handlePointerCancel = useCallback(() => {
      onGestureLock?.(false);
    }, [onGestureLock]);

    const scrollToSlide = useCallback(
      (slideIndex: number) => {
        emblaApi?.scrollTo(slideIndex);
      },
      [emblaApi]
    );

    const lastWheelTraversalRef = useRef(0);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const setViewportRef = useCallback(
      (node: HTMLDivElement | null) => {
        viewportRef.current = node;
        if (typeof emblaRef === "function") emblaRef(node);
        else if (emblaRef && typeof emblaRef === "object")
          (emblaRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      },
      [emblaRef]
    );
    useEffect(() => {
      const el = viewportRef.current;
      if (!el || media.length <= 1) return;
      const onWheel = (e: WheelEvent) => {
        if (!emblaApi) return;
        const now = Date.now();
        if (now - lastWheelTraversalRef.current < WHEEL_TRAVERSAL_COOLDOWN_MS) {
          e.preventDefault();
          return;
        }
        const dx = e.deltaX;
        const dy = e.deltaY;
        const useX = Math.abs(dx) >= Math.abs(dy);
        const delta = useX ? dx : dy;
        if (delta === 0) return;
        if (delta > 0) {
          emblaApi.scrollNext();
        } else {
          emblaApi.scrollPrev();
        }
        lastWheelTraversalRef.current = now;
        e.preventDefault();
      };
      el.addEventListener("wheel", onWheel, { passive: false });
      return () => el.removeEventListener("wheel", onWheel);
    }, [emblaApi, media.length]);

    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const touchHandledRef = useRef(false);
    const onTapRef = useRef(onTap);
    onTapRef.current = onTap;

    const handleTapViewportTouchStart = useCallback((e: React.TouchEvent) => {
      const t = e.touches[0];
      if (t) touchStartRef.current = { x: t.clientX, y: t.clientY };
    }, []);

    const handleTapViewportTouchEnd = useCallback((e: React.TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || !onTapRef.current) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= TAP_MOVE_THRESHOLD_PX) {
        touchHandledRef.current = true;
        onTapRef.current();
      }
    }, []);

    const handleTapViewportClick = useCallback((e: React.MouseEvent) => {
      if (touchHandledRef.current) {
        e.preventDefault();
        e.stopPropagation();
        touchHandledRef.current = false;
        return;
      }
      onTapRef.current?.();
    }, []);

    const handleTapViewportKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (!onTapRef.current) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onTapRef.current();
      }
    }, []);

    useImperativeHandle(ref, () => ({ scrollToSlide }), [scrollToSlide]);

    if (media.length === 0) {
      return (
        <Box className={className} style={{ minHeight: spacing(0), flex: 1 }}>
          <Image
            src={DEFAULT_PLACEHOLDER_IMAGE}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
          />
        </Box>
      );
    }

    return (
      <Box className={className} style={{ minHeight: spacing(0), flex: 1, position: "relative" }}>
        <Region
          ref={setViewportRef}
          role="button"
          tabIndex={0}
          label="Toggle playback"
          className="embla__viewport h-full w-full overflow-hidden"
          style={{
            touchAction: gestureLockedToHorizontal ? "pan-x" : "pan-y",
            overscrollBehaviorX: "none",
            WebkitOverflowScrolling: "touch",
          }}
          aria-roledescription="carousel"
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerCancel}
          onTouchEnd={handlePointerUp}
          onTouchCancel={handlePointerCancel}
          onTouchStart={handleTapViewportTouchStart}
          onTouchEndCapture={handleTapViewportTouchEnd}
          onClick={handleTapViewportClick}
          onKeyDown={handleTapViewportKeyDown}
        >
          <Box className="embla__container flex h-full">
            {media.map((item, i) => (
              <Box
                key={item.id ?? i}
                className="embla__slide relative h-full min-w-0 flex-[0_0_100%]"
              >
                {item.type === "video" ? (
                  isVisible && i === selectedIndex ? (
                    <Video
                      ref={activeVideoRef}
                      className="absolute inset-0 h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                      loop
                      poster={item.poster}
                    />
                  ) : (
                    <Image
                      src={item.poster ?? DEFAULT_PLACEHOLDER_IMAGE}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="eager"
                    />
                  )
                ) : (
                  <Image
                    src={item.src}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    loading={i === selectedIndex || i === selectedIndex + 1 ? "eager" : "lazy"}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Region>

        {media.length > 1 && !hideSlideIndicator && (
          <Region
            label={`Slide ${selectedIndex + 1} of ${media.length}`}
            className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5"
          >
            {media.map((_, i) => (
              <Button
                key={i}
                type="button"
                onClick={() => scrollToSlide(i)}
                variant="ghost"
                size="xs"
                rounded="full"
                className="!h-1.5 !max-h-1.5 !min-h-1.5 !w-1.5 !min-w-1.5 !max-w-1.5 shrink-0 !p-0 hover:bg-transparent focus:ring-white focus:ring-offset-transparent"
                style={{
                  backgroundColor:
                    i === selectedIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                }}
                aria-current={i === selectedIndex ? "true" : undefined}
                label={`Go to slide ${i + 1}`}
              />
            ))}
          </Region>
        )}
      </Box>
    );
  }
);
