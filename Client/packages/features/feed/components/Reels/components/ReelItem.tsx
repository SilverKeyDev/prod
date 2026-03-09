import { useCallback, useEffect, useRef, useState } from "react";

import { useMediaQuery } from "packages/hooks/ui";
import { useEmblaCarousel } from "packages/ui/components/adapters/carousel";
import { Image } from "packages/ui/components/primitives";
import { screenUp } from "packages/ui/types/screens";

import { Button, Region, Video } from "@/components/ui";
import type { PostData } from "@/features/feed/types/feed";
import { DEFAULT_PLACEHOLDER_IMAGE } from "@/features/feed/utils";

const DRAG_THRESHOLD_SMALL = 10;
const DRAG_THRESHOLD_LARGE = 120;
const LARGE_SCREEN_MEDIA = screenUp("md");

export type ReelItemProps = {
  post: PostData;
  isActive: boolean;
  /** Index of this post in the feed (for video mount optimization). */
  index: number;
  /** Index of the currently active post in the feed. */
  activeIndex: number;
};

const slideCount = (post: PostData): number => {
  const hasVideo = Boolean(post.videoUrl);
  const imageCount = post.imageUrls?.length ?? 0;
  return hasVideo ? 1 + imageCount : Math.max(1, imageCount);
};

/**
 * Single Reel: horizontal Embla carousel with slide 0 = video (if any),
 * slides 1..N = images. Video plays only when isActive && carouselIndex === 0.
 */
export function ReelItem({ post, isActive, index, activeIndex }: ReelItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = Boolean(post.videoUrl);
  const imageUrls = post.imageUrls ?? [];
  const totalSlides = slideCount(post);

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

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const shouldPlay = isActive && selectedIndex === 0 && hasVideo;

  useEffect(() => {
    if (!videoRef.current) return;
    if (shouldPlay) {
      void videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [shouldPlay]);

  const posterUrl = imageUrls[0] ?? undefined;
  const isNearActive = Math.abs(index - activeIndex) <= 1;
  const shouldMountVideo = hasVideo && (isActive || isNearActive);

  const scrollToSlide = useCallback(
    (slideIndex: number) => {
      emblaApi?.scrollTo(slideIndex);
    },
    [emblaApi]
  );

  return (
    <div
      className="relative w-full shrink-0 snap-start snap-always"
      style={{
        scrollSnapAlign: "start",
        height: "var(--reel-viewport-height, 100%)",
      }}
    >
      <div
        ref={emblaRef}
        className="embla__viewport h-full overflow-hidden"
        style={{
          touchAction: "pan-x pan-y",
          overscrollBehaviorX: "none",
          WebkitOverflowScrolling: "touch",
        }}
        aria-roledescription="carousel"
      >
        <div className="embla__container flex h-full">
          {hasVideo && (
            <div className="embla__slide relative h-full min-w-0 flex-[0_0_100%]">
              {shouldMountVideo && post.videoUrl ? (
                <Video
                  ref={videoRef}
                  src={post.videoUrl}
                  className="absolute inset-0 h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  loop
                  poster={posterUrl}
                />
              ) : (
                <Image
                  src={posterUrl ?? DEFAULT_PLACEHOLDER_IMAGE}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="eager"
                />
              )}
            </div>
          )}
          {imageUrls.map((src, i) => (
            <div
              key={`${post.id}-img-${i}`}
              className="embla__slide relative h-full min-w-0 flex-[0_0_100%]"
            >
              <Image
                src={src}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
          {!hasVideo && imageUrls.length === 0 && (
            <div className="embla__slide relative h-full min-w-0 flex-[0_0_100%]">
              <Image
                src={DEFAULT_PLACEHOLDER_IMAGE}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
              />
            </div>
          )}
        </div>
      </div>

      {totalSlides > 1 && (
        <Region
          label={`Slide ${selectedIndex + 1} of ${totalSlides}`}
          className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5"
        >
          {Array.from({ length: totalSlides }, (_, i) => (
            <Button
              key={i}
              variant="ghost"
              size="xs"
              onClick={() => scrollToSlide(i)}
              className="h-1.5 w-1.5 min-w-0 rounded-full p-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
    </div>
  );
}
