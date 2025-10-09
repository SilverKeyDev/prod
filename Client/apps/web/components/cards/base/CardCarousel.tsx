import { ChevronLeft, ChevronRight } from "lucide-react";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  memo,
  type ReactNode,
} from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import "../../../../../packages/styles/carousel.css";

import { Loading } from "../../ui/loading/Loading.tsx";

type CarouselLabels = { leftArrow: string; rightArrow: string; item: string };

export type CardCarouselProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey: (item: T, index: number) => string;

  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;

  /** UI */
  embeddedButton?: ReactNode;

  /** Base card sizing logic (used to decide how many fit per page) */
  /** Minimum natural width (px) you designed each card for; we’ll stretch/shrink to fit. */
  cardMinWidth?: number; // default 280
  /** Fixed gap (px) between cards */
  cardGap?: number; // default 16
  /** Optional clamps */
  minCols?: number; // default 1
  maxCols?: number; // default 4

  /** Show/hide side arrows */
  showSideArrows?: boolean; // default true

  /** Centering options from react-responsive-carousel (one-at-a-time view) */
  centerMode?: boolean; // default false

  /** react-responsive-carousel passthroughs */
  autoPlay?: boolean;
  infiniteLoop?: boolean;
  interval?: number;
  axis?: "horizontal" | "vertical";
  useKeyboardArrows?: boolean;
  emulateTouch?: boolean;
  swipeable?: boolean;
  stopOnHover?: boolean;
  transitionTime?: number;
  verticalSwipe?: "natural" | "standard";
  dynamicHeight?: boolean;
  preventMovementUntilSwipeScrollTolerance?: boolean;
  swipeScrollTolerance?: number;

  /** Accessibility */
  ariaLabel?: string;
  labels?: Partial<CarouselLabels>;
  statusFormatter?: (current: number, total: number) => string;

  /** External control hooks (page-based indexes) */
  onSlideChange?: (index: number) => void;
  selectedItem?: number;

  /** Animation handlers */
  animationHandler?: "slide" | "fade";
  swipeAnimationHandler?: (props: unknown) => React.CSSProperties;
  stopSwipingHandler?: (props: unknown) => React.CSSProperties;

  /** Optional custom UI overrides */
  renderArrowPrev?: (
    clickHandler: () => void,
    hasPrev: boolean,
    label: string
  ) => ReactNode;
  renderArrowNext?: (
    clickHandler: () => void,
    hasNext: boolean,
    label: string
  ) => ReactNode;
  renderIndicator?: (
    clickHandler: (e: React.MouseEvent | React.KeyboardEvent) => void,
    isSelected: boolean,
    index: number,
    label: string
  ) => ReactNode;

  /** Width of the carousel container (passed through to component) */
  width?: number | string;
};

function CardCarousel<T>({
  items,
  renderItem,
  getItemKey,

  loading = false,
  error = null,
  emptyMessage = "No items to display",

  embeddedButton,

  // sizing logic
  cardMinWidth = 280,
  cardGap = 16,
  minCols = 1,
  maxCols = 4,

  showSideArrows = true,

  centerMode = false,

  // passthroughs
  autoPlay = false,
  infiniteLoop = true,
  interval,
  axis = "horizontal",
  useKeyboardArrows = true,
  emulateTouch = true,
  swipeable = true,
  stopOnHover = true,
  transitionTime = 300,
  verticalSwipe = "standard",
  dynamicHeight = false,
  preventMovementUntilSwipeScrollTolerance = false,
  swipeScrollTolerance = 5,

  ariaLabel,
  labels,
  statusFormatter,

  onSlideChange,
  selectedItem,

  animationHandler = "slide",
  swipeAnimationHandler,
  stopSwipingHandler,

  renderArrowPrev,
  renderArrowNext,

  width = "100%",
}: CardCarouselProps<T>) {
  type CSSVars = React.CSSProperties & {
    ["--gap"]?: string;
    ["--cols"]?: string;
  };
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // Memoize the getItemKey function to prevent unnecessary re-renders
  const stableGetItemKey = useCallback(getItemKey, [getItemKey]);

  // Memoize renderItem to prevent re-creation on every render
  const stableRenderItem = useCallback(renderItem, [renderItem]);

  // Handle slide change to track current slide and manage visibility
  const handleSlideChange = useCallback(
    (index: number) => {
      setCurrentSlideIndex(index);
      if (onSlideChange) {
        onSlideChange(index);
      }
    },
    [onSlideChange]
  );

  // Handle animation start/end for visibility timing
  const handleAnimationStart = useCallback(() => {
    setIsAnimating(true);
  }, []);

  const handleAnimationEnd = useCallback(() => {
    setIsAnimating(false);
  }, []);

  // Throttled resize handler to prevent excessive re-renders
  const throttledSetWidth = useCallback((width: number) => {
    // Only update if width actually changed by a meaningful amount
    setContainerWidth((prev) => (Math.abs(prev - width) > 10 ? width : prev));
  }, []);

  // Observe size of the container to compute how many cards fit
  useEffect(() => {
    // Only run when we have items and aren't loading
    if (loading ?? items.length === 0) {
      return;
    }

    const el = containerRef.current;
    if (!el) {
      // Retry after a short delay
      const retryTimer = setTimeout(() => {
        const retryEl = containerRef.current;
        if (retryEl) {
          const width = retryEl.clientWidth;
          if (width > 0) {
            throttledSetWidth(width);
          }
        }
      }, 50);
      return () => clearTimeout(retryTimer);
    }

    let rafId: number;
    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const width = el.clientWidth;
        throttledSetWidth(width);
      });
    };

    // Initial update with delay to ensure DOM is rendered
    setTimeout(() => {
      const width = el.clientWidth;
      if (width > 0) {
        throttledSetWidth(width);
      } else {
        // Fallback: try parent container width
        const parent = el.parentElement;
        if (parent) {
          const parentWidth = parent.clientWidth;
          throttledSetWidth(parentWidth - 32); // Account for padding
        }
      }
    }, 100);

    update();

    // ResizeObserver for robust responsiveness
    const ro =
      "ResizeObserver" in window ? new ResizeObserver(() => update()) : null;

    ro?.observe(el);
    // Fallback: window resize
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(rafId);
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [throttledSetWidth, loading, items.length]);

  /** Compute how many cards fit given cardMinWidth, gap, and containerWidth.
   * Rule: try to fit as many as possible; if they can't fit with the 16px gap,
   * move down one card; if they can fit another with the gap, move up one.
   * Then stretch widths so there are NO partial cards and consistent gaps.
   */
  const computedCols = useMemo(() => {
    if (centerMode) return 1; // centerMode shows one-at-a-time by design

    const w = Math.max(0, containerWidth);
    const minW = Math.max(1, Math.floor(cardMinWidth));
    const gap = Math.max(0, Math.floor(cardGap));

    if (w === 0) {
      return Math.max(1, minCols); // initial render
    }

    // Max cards that could fit by naive packing (with gap between them)
    // FitCols satisfies: cols*minW + (cols-1)*gap <= w
    let cols = Math.floor((w + gap) / (minW + gap));

    cols = Math.max(minCols, Math.min(cols, maxCols));

    // Ensure that the chosen cols actually fit; if not, decrement until it does
    const fits = (c: number) => c * minW + (c - 1) * gap <= w;
    while (cols > minCols && !fits(cols)) {
      cols--;
    }

    // If there's room for one more, and it fits, increment
    while (cols < maxCols && fits(cols + 1)) {
      cols++;
    }

    return Math.max(1, cols);
  }, [centerMode, containerWidth, cardMinWidth, cardGap, minCols, maxCols]);

  // Chunk items into pages of computedCols with stable references
  const pages = useMemo(() => {
    const perPage = Math.max(1, computedCols);
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += perPage) {
      chunks.push(items.slice(i, i + perPage));
    }
    return chunks.length ? chunks : [[]];
  }, [items, computedCols]);

  /** Normalize labels for the underlying library - memoized for stability */
  const safeLabels = useMemo(
    () =>
      labels
        ? {
            leftArrow: labels.leftArrow ?? "previous slide / item",
            rightArrow: labels.rightArrow ?? "next slide / item",
            item: labels.item ?? "slide item",
          }
        : undefined,
    [labels]
  );

  // Calculate which cards should be visible (all cards on current page)
  const getCardVisibility = useCallback(
    (globalIndex: number) => {
      if (isAnimating) {
        return true; // Show all cards during animation
      }

      // Show all cards that fit on the current page
      const cardsPerPage = Math.max(1, computedCols);
      const currentPageStartIndex = currentSlideIndex * cardsPerPage;
      const currentPageEndIndex = currentPageStartIndex + cardsPerPage - 1;

      // Card is visible if it's within the current page range
      return (
        globalIndex >= currentPageStartIndex &&
        globalIndex <= currentPageEndIndex
      );
    },
    [isAnimating, currentSlideIndex, computedCols]
  );

  /** Memoized navigation arrows to prevent re-creation on every render */
  const LeftArrow = useMemo(
    () => (clickHandler: () => void, hasPrev: boolean, label: string) => (
      <button
        type="button"
        onClick={() => {
          handleAnimationStart();
          clickHandler();
        }}
        aria-label={label}
        disabled={!hasPrev}
        className={`absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl p-2 transition-all duration-200 ${
          hasPrev
            ? "border border-gray-200 bg-white/90 text-gray-700 shadow-md hover:bg-white hover:text-brown hover:shadow-lg"
            : "cursor-not-allowed bg-gray-100 text-gray-400"
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    ),
    [handleAnimationStart]
  );

  const RightArrow = useMemo(
    () => (clickHandler: () => void, hasNext: boolean, label: string) => (
      <button
        type="button"
        onClick={() => {
          handleAnimationStart();
          clickHandler();
        }}
        aria-label={label}
        disabled={!hasNext}
        className={`absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl p-2 transition-all duration-200 ${
          hasNext
            ? "border border-gray-200 bg-white/90 text-gray-700 shadow-md hover:bg-white hover:text-brown hover:shadow-lg"
            : "cursor-not-allowed bg-gray-100 text-gray-400"
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    ),
    [handleAnimationStart]
  );

  // Add animation end handler with delay to ensure animation completes
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        handleAnimationEnd();
      }, transitionTime ?? 300);

      return () => clearTimeout(timer);
    }
  }, [isAnimating, transitionTime, handleAnimationEnd]);

  return (
    <div aria-label={ariaLabel} className="sk-carousel">
      {embeddedButton && (
        <div className="mb-6 flex w-full items-center justify-between sm:mb-8">
          <div className="flex h-10 items-center">
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-800 hover:text-gray-900 transition-colors duration-200">
              {embeddedButton}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6 sm:py-8">
          <Loading message="Loading..." />
        </div>
      ) : error ? (
        <p className="py-4 text-center text-sm text-neutral-500">{error}</p>
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-500">
          {emptyMessage}
        </p>
      ) : (
        <div
          className="relative min-w-0 max-w-full overflow-hidden"
          ref={containerRef}
        >
          <div className="sk-carousel-clip relative box-border min-w-0 max-w-full overflow-hidden">
            <Carousel
              showThumbs={false}
              showStatus={false}
              showIndicators={false}
              showArrows={!!showSideArrows}
              width={width}
              axis={axis}
              infiniteLoop={!!infiniteLoop}
              autoPlay={!!autoPlay}
              interval={interval}
              transitionTime={transitionTime}
              emulateTouch={!!emulateTouch}
              swipeable={!!swipeable}
              stopOnHover={!!stopOnHover}
              useKeyboardArrows={!!useKeyboardArrows}
              dynamicHeight={!!dynamicHeight}
              verticalSwipe={verticalSwipe}
              preventMovementUntilSwipeScrollTolerance={
                !!preventMovementUntilSwipeScrollTolerance
              }
              swipeScrollTolerance={swipeScrollTolerance}
              selectedItem={selectedItem}
              onChange={handleSlideChange}
              onSwipeStart={handleAnimationStart}
              onSwipeEnd={handleAnimationEnd}
              animationHandler={animationHandler}
              swipeAnimationHandler={swipeAnimationHandler}
              stopSwipingHandler={stopSwipingHandler}
              labels={safeLabels}
              statusFormatter={statusFormatter}
              centerMode={false}
              centerSlidePercentage={undefined}
              renderArrowPrev={
                showSideArrows ? (renderArrowPrev ?? LeftArrow) : undefined
              }
              renderArrowNext={
                showSideArrows ? (renderArrowNext ?? RightArrow) : undefined
              }
            >
              {pages.map((page, pIdx) => {
                return (
                  <div key={`page-${pIdx}`} className="min-w-0">
                    {/* Row container with CSS variables for robust sizing */}
                    <div
                      className="flex w-full items-stretch"
                      style={
                        {
                          "--gap": `${Math.max(0, cardGap)}px`,
                          "--cols": `${centerMode ? 1 : Math.max(1, computedCols)}`,
                          gap: `var(--gap)`,
                          justifyContent:
                            computedCols === 1
                              ? "center"
                              : page.length === computedCols
                                ? "space-between"
                                : "flex-start",
                          paddingLeft: computedCols > 1 ? "0.5rem" : "0",
                          paddingRight: computedCols > 1 ? "0.5rem" : "0",
                        } as CSSVars
                      }
                    >
                      {page.map((item, idx) => {
                        const globalIndex =
                          Math.max(1, computedCols) * pIdx + idx;
                        const itemKey = stableGetItemKey(item, globalIndex);
                        const isVisible = getCardVisibility(globalIndex);

                        return (
                          <div
                            key={itemKey}
                            className={`carousel-card min-w-0 ${
                              isVisible
                                ? "carousel-card-visible"
                                : "carousel-card-hidden"
                            }`}
                            style={
                              {
                                // No partials: exact width so cols fit with gap
                                flex: "0 0 auto",
                                width:
                                  "calc((100% - (var(--gap) * (var(--cols) - 1))) / var(--cols))",
                              } as React.CSSProperties
                            }
                          >
                            {stableRenderItem(item, globalIndex)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </Carousel>
          </div>
        </div>
      )}
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(CardCarousel) as typeof CardCarousel;
