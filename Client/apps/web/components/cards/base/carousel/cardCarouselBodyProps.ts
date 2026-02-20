import type React from "react";

import type { CardCarouselBodyProps } from "./CardCarouselTypes";
import type { CardCarouselProps } from "./CardCarouselTypes";

const D = {
  loading: false,
  error: null as string | null,
  emptyMessage: "No items to display",
  showSideArrows: true,
  autoPlay: false,
  infiniteLoop: true,
  axis: "horizontal" as const,
  useKeyboardArrows: true,
  emulateTouch: true,
  swipeable: true,
  stopOnHover: true,
  transitionTime: 300,
  verticalSwipe: "standard" as const,
  dynamicHeight: false,
  preventMovementUntilSwipeScrollTolerance: false,
  swipeScrollTolerance: 5,
  animationHandler: "slide" as const,
  width: "100%",
};

type CarouselState = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleSlideChange: (index: number) => void;
  handleAnimationStart: () => void;
  handleAnimationEnd: () => void;
  safeLabels:
    | { leftArrow: string; rightArrow: string; item: string }
    | undefined;
  pages: unknown[][];
  computedCols: number;
  stableGetItemKey: (item: unknown, globalIndex: number) => string;
  getCardVisibility: (globalIndex: number) => boolean;
  stableRenderItem: (item: unknown, globalIndex: number) => React.ReactNode;
};

function buildBodyPropsFromPropsPart1<T>(
  props: CardCarouselProps<T>,
): Partial<CardCarouselBodyProps<T>> {
  return {
    loading: props.loading ?? D.loading,
    error: props.error ?? D.error,
    itemsLength: props.items.length,
    emptyMessage: props.emptyMessage ?? D.emptyMessage,
    width: (props.width ?? D.width) as string,
    showSideArrows: props.showSideArrows ?? D.showSideArrows,
    renderArrowPrev: props.renderArrowPrev,
    renderArrowNext: props.renderArrowNext,
    axis: props.axis ?? D.axis,
    infiniteLoop: props.infiniteLoop ?? D.infiniteLoop,
    autoPlay: props.autoPlay ?? D.autoPlay,
    interval: props.interval,
    transitionTime: props.transitionTime ?? D.transitionTime,
    emulateTouch: props.emulateTouch ?? D.emulateTouch,
    swipeable: props.swipeable ?? D.swipeable,
  };
}

function buildBodyPropsFromPropsPart2<T>(
  props: CardCarouselProps<T>,
): Partial<CardCarouselBodyProps<T>> {
  return {
    stopOnHover: props.stopOnHover ?? D.stopOnHover,
    useKeyboardArrows: props.useKeyboardArrows ?? D.useKeyboardArrows,
    dynamicHeight: props.dynamicHeight ?? D.dynamicHeight,
    verticalSwipe: props.verticalSwipe ?? D.verticalSwipe,
    preventMovementUntilSwipeScrollTolerance:
      props.preventMovementUntilSwipeScrollTolerance ??
      D.preventMovementUntilSwipeScrollTolerance,
    swipeScrollTolerance: props.swipeScrollTolerance ?? D.swipeScrollTolerance,
    selectedItem: props.selectedItem,
    animationHandler: props.animationHandler ?? D.animationHandler,
    swipeAnimationHandler: props.swipeAnimationHandler,
    stopSwipingHandler: props.stopSwipingHandler,
    statusFormatter: props.statusFormatter,
    centerMode: props.centerMode ?? false,
    cardGap: props.cardGap ?? 16,
  };
}

function buildBodyPropsFromProps<T>(
  props: CardCarouselProps<T>,
): Partial<CardCarouselBodyProps<T>> {
  return {
    ...buildBodyPropsFromPropsPart1(props),
    ...buildBodyPropsFromPropsPart2(props),
  };
}

function buildBodyPropsFromState<T>(
  props: CardCarouselProps<T>,
  state: CarouselState,
): Partial<CardCarouselBodyProps<T>> {
  return {
    containerRef: state.containerRef,
    handleSlideChange: state.handleSlideChange,
    handleAnimationStart: state.handleAnimationStart,
    handleAnimationEnd: state.handleAnimationEnd,
    safeLabels: state.safeLabels,
    pages: state.pages as T[][],
    computedCols: state.computedCols,
    stableGetItemKey: state.stableGetItemKey as (
      item: T,
      globalIndex: number,
    ) => string,
    getCardVisibility: state.getCardVisibility,
    stableRenderItem: state.stableRenderItem as (
      item: T,
      globalIndex: number,
    ) => React.ReactNode,
  };
}

export function buildCardCarouselBodyProps<T>(
  props: CardCarouselProps<T>,
  state: CarouselState,
  LeftArrow: CardCarouselBodyProps<T>["LeftArrow"],
  RightArrow: CardCarouselBodyProps<T>["RightArrow"],
): CardCarouselBodyProps<T> {
  return {
    ...buildBodyPropsFromProps(props),
    ...buildBodyPropsFromState(props, state),
    LeftArrow,
    RightArrow,
  } as CardCarouselBodyProps<T>;
}
