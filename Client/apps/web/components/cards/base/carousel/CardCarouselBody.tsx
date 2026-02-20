import React from "react";

import { Carousel } from "react-responsive-carousel";

import { useLocalization } from "packages/contexts";

import { BodyText } from "@/components/ui/index.web";
import { Loading } from "@/components/ui/loading/Loading";

import type { CardCarouselBodyProps } from "./CardCarouselTypes";

type CSSVars = React.CSSProperties & {
  ["--gap"]?: string;
  ["--cols"]?: string;
};

function CarouselSlidesContent<T>({
  pages,
  computedCols,
  centerMode,
  cardGap,
  stableGetItemKey,
  getCardVisibility,
  stableRenderItem,
}: {
  pages: T[][];
  computedCols: number;
  centerMode: boolean;
  cardGap: number;
  stableGetItemKey: (item: T, globalIndex: number) => string;
  getCardVisibility: (globalIndex: number) => boolean;
  stableRenderItem: (item: T, globalIndex: number) => React.ReactNode;
}) {
  return (
    <>
      {pages.map((page, pIdx) => (
        <div key={`page-${pIdx}`} className="min-w-0">
          <div
            className="flex w-full items-stretch"
            style={
              {
                "--gap": `${Math.max(0, cardGap)}px`,
                "--cols": `${centerMode ? 1 : Math.max(1, computedCols)}`,
                gap: "var(--gap)",
                justifyContent:
                  computedCols === 1
                    ? "center"
                    : page.length === computedCols
                      ? "space-between"
                      : "flex-start",
              } as CSSVars
            }
          >
            {page.map((item, idx) => {
              const globalIndex = Math.max(1, computedCols) * pIdx + idx;
              const itemKey = stableGetItemKey(item, globalIndex);
              const isVisible = getCardVisibility(globalIndex);
              return (
                <div
                  key={itemKey}
                  className={`carousel-card min-w-0 ${
                    isVisible ? "carousel-card-visible" : "carousel-card-hidden"
                  }`}
                  style={
                    {
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
      ))}
    </>
  );
}

type CarouselWithSlidesProps<T> = Omit<
  CardCarouselBodyProps<T>,
  "loading" | "error" | "itemsLength" | "emptyMessage" | "containerRef"
> & { containerRef: React.RefObject<HTMLDivElement | null> };

function getCarouselSpreadProps<T>(props: CarouselWithSlidesProps<T>) {
  const {
    width,
    showSideArrows,
    renderArrowPrev,
    renderArrowNext,
    LeftArrow,
    RightArrow,
    axis,
    infiniteLoop,
    autoPlay,
    interval,
    transitionTime,
    emulateTouch,
    swipeable,
    stopOnHover,
    useKeyboardArrows,
    dynamicHeight,
    verticalSwipe,
    preventMovementUntilSwipeScrollTolerance,
    swipeScrollTolerance,
    selectedItem,
    handleSlideChange,
    handleAnimationStart,
    handleAnimationEnd,
    animationHandler,
    swipeAnimationHandler,
    stopSwipingHandler,
    safeLabels,
    statusFormatter,
  } = props;
  return {
    showThumbs: false,
    showStatus: false,
    showIndicators: false,
    showArrows: !!showSideArrows,
    width,
    axis,
    infiniteLoop: !!infiniteLoop,
    autoPlay: !!autoPlay,
    interval,
    transitionTime,
    emulateTouch: !!emulateTouch,
    swipeable: !!swipeable,
    stopOnHover: !!stopOnHover,
    useKeyboardArrows: !!useKeyboardArrows,
    dynamicHeight: !!dynamicHeight,
    verticalSwipe,
    preventMovementUntilSwipeScrollTolerance:
      !!preventMovementUntilSwipeScrollTolerance,
    swipeScrollTolerance,
    selectedItem,
    onChange: handleSlideChange,
    onSwipeStart: handleAnimationStart,
    onSwipeEnd: handleAnimationEnd,
    animationHandler,
    swipeAnimationHandler,
    stopSwipingHandler,
    labels: safeLabels,
    statusFormatter,
    centerMode: false,
    centerSlidePercentage: undefined,
    renderArrowPrev: showSideArrows
      ? (renderArrowPrev ?? LeftArrow)
      : undefined,
    renderArrowNext: showSideArrows
      ? (renderArrowNext ?? RightArrow)
      : undefined,
  };
}

function CarouselInner<T>(props: CarouselWithSlidesProps<T>) {
  const {
    pages,
    computedCols,
    centerMode,
    cardGap,
    stableGetItemKey,
    getCardVisibility,
    stableRenderItem,
  } = props;
  const carouselProps = getCarouselSpreadProps(props);
  return (
    <Carousel {...carouselProps}>
      <CarouselSlidesContent
        pages={pages}
        computedCols={computedCols}
        centerMode={centerMode}
        cardGap={cardGap}
        stableGetItemKey={stableGetItemKey}
        getCardVisibility={getCardVisibility}
        stableRenderItem={stableRenderItem}
      />
    </Carousel>
  );
}

function CarouselWithSlides<T>(props: CarouselWithSlidesProps<T>) {
  const { containerRef } = props;
  return (
    <div
      className="relative min-w-0 max-w-full overflow-hidden"
      ref={containerRef}
    >
      <div className="sk-carousel-clip relative box-border min-w-0 max-w-full overflow-hidden">
        <CarouselInner {...props} />
      </div>
    </div>
  );
}

export function CardCarouselBody<T>(props: CardCarouselBodyProps<T>) {
  const { t } = useLocalization();
  const { loading, error, itemsLength } = props;

  if (loading) {
    return (
      <div className="flex justify-center py-6 sm:py-8">
        <Loading message={t("common.loading")} />
      </div>
    );
  }
  if (error) {
    return (
      <BodyText as="p" className="py-4 text-center text-sm text-neutral-500">
        {error}
      </BodyText>
    );
  }
  if (itemsLength === 0) {
    return (
      <BodyText as="p" className="py-4 text-center text-sm text-neutral-500">
        {props.emptyMessage}
      </BodyText>
    );
  }
  return <CarouselWithSlides {...props} />;
}
