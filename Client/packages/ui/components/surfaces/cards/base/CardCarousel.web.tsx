import React, { useCallback, useEffect, useRef, useState } from "react";

import IconButton from "packages/ui/components/actions/button/IconButton";
import { Box } from "packages/ui/components/structure/primitives";

export type CardCarouselProps<T> = {
  items: T[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T, index: number) => string;
  cardMinWidth?: number;
  /**
   * CSS flex-basis for each slide (e.g. "85%" or "min(26rem, 88%)").
   * When set, slides size from the viewport so the next card peeks — same pattern as
   * search mobile PropertyCarousel.
   */
  cardBasis?: string;
  cardGap?: number;
  infiniteLoop?: boolean;
  centerMode?: boolean;
  selectedItem?: number;
  onSlideChange?: (index: number) => void;
  ariaLabel?: string;
  /** Prev/next chevrons overlaid on the track (SharedHomeBundleCard pattern). */
  showNavigation?: boolean;
};

function CardCarousel<T>({
  items,
  loading = false,
  error = null,
  emptyMessage,
  renderItem,
  getItemKey,
  cardMinWidth = 240,
  cardBasis,
  cardGap = 12,
  selectedItem,
  onSlideChange,
  ariaLabel = "Carousel",
  showNavigation = false,
}: CardCarouselProps<T>): React.JSX.Element {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(items.length > 1);

  const updateNavState = useCallback(() => {
    const el = trackRef.current;
    if (!el) {
      setCanGoPrev(false);
      setCanGoNext(false);
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanGoPrev(el.scrollLeft > 4);
    setCanGoNext(el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateNavState();
    el.addEventListener("scroll", updateNavState, { passive: true });
    const win = typeof window !== "undefined" ? window : null;
    win?.addEventListener("resize", updateNavState);
    return () => {
      el.removeEventListener("scroll", updateNavState);
      win?.removeEventListener("resize", updateNavState);
    };
  }, [items.length, cardBasis, cardMinWidth, updateNavState]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || selectedItem == null) return;
    const slide = el.children[selectedItem] as HTMLElement | undefined;
    if (!slide) return;
    slide.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    onSlideChange?.(selectedItem);
  }, [selectedItem, onSlideChange]);

  const scrollBySlide = useCallback(
    (direction: -1 | 1) => {
      const el = trackRef.current;
      if (!el) return;
      const firstSlide = el.children[0] as HTMLElement | undefined;
      const delta = (firstSlide?.offsetWidth ?? el.clientWidth * 0.85) + cardGap;
      el.scrollBy({ left: direction * delta, behavior: "smooth" });
    },
    [cardGap]
  );

  if (loading) {
    return (
      <Box
        className="scrollbar-hide flex w-full min-w-0 gap-4 overflow-x-auto p-2"
        aria-label={ariaLabel}
      >
        <Box className="h-48 min-w-52 animate-pulse rounded-lg bg-gray-200" />
        <Box className="h-48 min-w-52 animate-pulse rounded-lg bg-gray-200" />
        <Box className="h-48 min-w-52 animate-pulse rounded-lg bg-gray-200" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="p-4 text-sm text-red-600" role="alert">
        {error}
      </Box>
    );
  }

  if (items.length === 0 && emptyMessage) {
    return (
      <Box className="p-4 text-sm text-gray-500" aria-label={ariaLabel}>
        {emptyMessage}
      </Box>
    );
  }

  const showNav = showNavigation && items.length > 1;

  return (
    <Box className="relative w-full min-w-0 max-w-full" aria-label={ariaLabel}>
      <Box
        ref={trackRef}
        className="scrollbar-hide flex w-full min-w-0 max-w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth py-2"
        style={{ gap: cardGap }}
        role="list"
      >
        {items.map((item, index) => (
          <Box
            key={getItemKey(item, index)}
            className="min-w-0 flex-shrink-0 snap-start"
            style={
              cardBasis
                ? { flex: `0 0 ${cardBasis}`, width: cardBasis }
                : { minWidth: cardMinWidth }
            }
            role="listitem"
          >
            {renderItem(item, index)}
          </Box>
        ))}
      </Box>
      {showNav ? (
        <>
          <IconButton
            iconName="chevron-left"
            variant="secondary"
            size="sm"
            rounded="full"
            label={`Previous in ${ariaLabel}`}
            disabled={!canGoPrev}
            onPress={() => scrollBySlide(-1)}
            className="border-border bg-background-base/95 z-header absolute left-1 top-1/2 -translate-y-1/2 shadow-sm disabled:opacity-40"
            testID="card-carousel-prev"
          />
          <IconButton
            iconName="chevron-right"
            variant="secondary"
            size="sm"
            rounded="full"
            label={`Next in ${ariaLabel}`}
            disabled={!canGoNext}
            onPress={() => scrollBySlide(1)}
            className="border-border bg-background-base/95 z-header absolute right-1 top-1/2 -translate-y-1/2 shadow-sm disabled:opacity-40"
            testID="card-carousel-next"
          />
        </>
      ) : null}
    </Box>
  );
}

export default CardCarousel;
