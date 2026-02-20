import { useCallback, useMemo, useRef, useState } from "react";

import { useContainerWidth } from "packages/hooks/ui/useContainerWidth";

import type { CardCarouselProps } from "./CardCarouselTypes";
import { computeCarouselCols } from "./carouselUtils";

export { computeCarouselCols };

function useCardCarouselRefsAndHandlers<T>(props: {
  getItemKey: CardCarouselProps<T>["getItemKey"];
  renderItem: CardCarouselProps<T>["renderItem"];
  onSlideChange?: CardCarouselProps<T>["onSlideChange"];
}) {
  const { getItemKey, renderItem, onSlideChange } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerWidth = useContainerWidth(containerRef, { minDelta: 10 });
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  const stableGetItemKey = useCallback(
    (item: T, globalIndex: number) => getItemKey(item, globalIndex),
    [getItemKey],
  );
  const stableRenderItem = useCallback(
    (item: T, globalIndex: number) => renderItem(item, globalIndex),
    [renderItem],
  );
  const handleSlideChange = useCallback(
    (index: number) => {
      setCurrentSlideIndex(index);
      onSlideChange?.(index);
    },
    [onSlideChange],
  );
  const handleAnimationStart = useCallback(() => setIsAnimating(true), []);
  const handleAnimationEnd = useCallback(() => setIsAnimating(false), []);

  return {
    containerRef,
    containerWidth,
    isAnimating,
    currentSlideIndex,
    stableGetItemKey,
    stableRenderItem,
    handleSlideChange,
    handleAnimationStart,
    handleAnimationEnd,
  };
}

function useCardCarouselDerived<T>(props: {
  containerWidth: number;
  items: T[];
  isAnimating: boolean;
  currentSlideIndex: number;
  labels: CardCarouselProps<T>["labels"];
  centerMode?: boolean;
  cardMinWidth?: number;
  cardGap?: number;
  minCols?: number;
  maxCols?: number;
}) {
  const computedCols = useMemo(
    () =>
      computeCarouselCols({
        containerWidth: Math.max(0, props.containerWidth),
        centerMode: props.centerMode ?? false,
        cardMinWidth: props.cardMinWidth ?? 280,
        cardGap: props.cardGap ?? 16,
        minCols: props.minCols ?? 1,
        maxCols: props.maxCols ?? 4,
      }),
    [
      props.centerMode,
      props.containerWidth,
      props.cardMinWidth,
      props.cardGap,
      props.minCols,
      props.maxCols,
    ],
  );

  const pages = useMemo(() => {
    const perPage = Math.max(1, computedCols);
    const chunks: T[][] = [];
    for (let i = 0; i < props.items.length; i += perPage) {
      chunks.push(props.items.slice(i, i + perPage));
    }
    return chunks.length ? chunks : [[]];
  }, [props.items, computedCols]);

  const safeLabels = useMemo(
    () =>
      props.labels
        ? {
            leftArrow: props.labels.leftArrow ?? "previous slide / item",
            rightArrow: props.labels.rightArrow ?? "next slide / item",
            item: props.labels.item ?? "slide item",
          }
        : undefined,
    [props.labels],
  );

  const getCardVisibility = useCallback(
    (globalIndex: number) => {
      if (props.isAnimating) return true;
      const cardsPerPage = Math.max(1, computedCols);
      const start = props.currentSlideIndex * cardsPerPage;
      const end = start + cardsPerPage - 1;
      return globalIndex >= start && globalIndex <= end;
    },
    [props.isAnimating, props.currentSlideIndex, computedCols],
  );

  return { computedCols, pages, safeLabels, getCardVisibility };
}

export function useCardCarouselState<T>(props: CardCarouselProps<T>) {
  const refsAndHandlers = useCardCarouselRefsAndHandlers({
    getItemKey: props.getItemKey,
    renderItem: props.renderItem,
    onSlideChange: props.onSlideChange,
  });

  const derived = useCardCarouselDerived({
    containerWidth: refsAndHandlers.containerWidth,
    items: props.items,
    isAnimating: refsAndHandlers.isAnimating,
    currentSlideIndex: refsAndHandlers.currentSlideIndex,
    labels: props.labels,
    centerMode: props.centerMode,
    cardMinWidth: props.cardMinWidth,
    cardGap: props.cardGap,
    minCols: props.minCols,
    maxCols: props.maxCols,
  });

  return {
    ...refsAndHandlers,
    ...derived,
  };
}
