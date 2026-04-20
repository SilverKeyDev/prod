import { useLayoutEffect, useRef, useState } from "react";

import {
  SEARCH_HEADER_FILTER_GAP_PX,
  SEARCH_HEADER_FILTER_PROMOTION_ORDER,
} from "packages/features/search/utils/filters/searchHeaderFilterOrder";

const DEFAULT_OVERFLOW_FROM_INDEX = 3;

export function useSearchFilterControlsOverflow(containerWidth: number) {
  const [overflowFromIndex, setOverflowFromIndex] = useState(DEFAULT_OVERFLOW_FROM_INDEX);
  const measureRefs = useRef<(HTMLDivElement | null)[]>(
    Array.from({ length: SEARCH_HEADER_FILTER_PROMOTION_ORDER.length }, () => null)
  );
  const measureRefMore = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (containerWidth <= 0) return;
    const chipWidths = measureRefs.current.map((el) => el?.getBoundingClientRect().width ?? 0);
    const moreWidth = measureRefMore.current?.getBoundingClientRect().width ?? 0;
    if (moreWidth <= 0) return;
    const need = moreWidth + SEARCH_HEADER_FILTER_GAP_PX;
    let numVisibleInHeader = 0;
    for (let i = 0; i <= SEARCH_HEADER_FILTER_PROMOTION_ORDER.length; i++) {
      const chipSum = i === 0 ? 0 : chipWidths.slice(0, i).reduce((a, b) => a + b, 0);
      const total = chipSum + i * SEARCH_HEADER_FILTER_GAP_PX + need;
      if (total <= containerWidth) numVisibleInHeader = i;
      else break;
    }
    setOverflowFromIndex(numVisibleInHeader);
  }, [containerWidth]);

  return {
    overflowFromIndex,
    measureRefs,
    measureRefMore,
  };
}
