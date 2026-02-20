import type { ReactNode, RefObject } from "react";
import type {
  StopSwipingHandler,
  SwipeAnimationHandler,
} from "react-responsive-carousel/lib/ts/components/Carousel/types";

export type CarouselLabels = {
  leftArrow: string;
  rightArrow: string;
  item: string;
};

export type CardCarouselProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey: (item: T, index: number) => string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  embeddedButton?: ReactNode;
  cardMinWidth?: number;
  cardGap?: number;
  minCols?: number;
  maxCols?: number;
  showSideArrows?: boolean;
  centerMode?: boolean;
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
  ariaLabel?: string;
  labels?: Partial<CarouselLabels>;
  statusFormatter?: (current: number, total: number) => string;
  onSlideChange?: (index: number) => void;
  selectedItem?: number;
  animationHandler?: "slide" | "fade";
  swipeAnimationHandler?: SwipeAnimationHandler;
  stopSwipingHandler?: StopSwipingHandler;
  renderArrowPrev?: (
    clickHandler: () => void,
    hasPrev: boolean,
    label: string,
  ) => ReactNode;
  renderArrowNext?: (
    clickHandler: () => void,
    hasNext: boolean,
    label: string,
  ) => ReactNode;
  renderIndicator?: (
    clickHandler: (e: React.MouseEvent | React.KeyboardEvent) => void,
    isSelected: boolean,
    index: number,
    label: string,
  ) => ReactNode;
  width?: number | string;
};

export type CardCarouselBodyProps<T> = {
  loading: boolean;
  error: string | null;
  itemsLength: number;
  emptyMessage: string;
  containerRef: RefObject<HTMLDivElement | null>;
  width: string;
  showSideArrows: boolean;
  renderArrowPrev?: (
    clickHandler: () => void,
    hasPrev: boolean,
    label: string,
  ) => ReactNode;
  renderArrowNext?: (
    clickHandler: () => void,
    hasNext: boolean,
    label: string,
  ) => ReactNode;
  LeftArrow: (
    clickHandler: () => void,
    hasPrev: boolean,
    label: string,
  ) => ReactNode;
  RightArrow: (
    clickHandler: () => void,
    hasNext: boolean,
    label: string,
  ) => ReactNode;
  axis: "horizontal" | "vertical";
  infiniteLoop: boolean;
  autoPlay: boolean;
  interval?: number;
  transitionTime: number;
  emulateTouch: boolean;
  swipeable: boolean;
  stopOnHover: boolean;
  useKeyboardArrows: boolean;
  dynamicHeight: boolean;
  verticalSwipe: "standard" | "natural";
  preventMovementUntilSwipeScrollTolerance: boolean;
  swipeScrollTolerance: number;
  selectedItem?: number;
  handleSlideChange: (index: number) => void;
  handleAnimationStart: () => void;
  handleAnimationEnd: () => void;
  animationHandler: "slide" | "fade" | ((props: unknown) => unknown);
  swipeAnimationHandler?: (props: unknown) => unknown;
  stopSwipingHandler?: () => void;
  safeLabels:
    | { leftArrow: string; rightArrow: string; item: string }
    | undefined;
  statusFormatter?: (current: number, total: number) => string;
  pages: T[][];
  computedCols: number;
  centerMode: boolean;
  cardGap: number;
  stableGetItemKey: (item: T, globalIndex: number) => string;
  getCardVisibility: (globalIndex: number) => boolean;
  stableRenderItem: (item: T, globalIndex: number) => ReactNode;
};
