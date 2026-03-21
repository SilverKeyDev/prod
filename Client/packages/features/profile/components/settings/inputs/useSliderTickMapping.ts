import { useCallback } from "react";

/**
 * Maps between slider percent (0–100) and tick values for non-linear scales.
 * Shared by BudgetRangeSlider and PriceRangeSlider.
 */
export function useSliderTickMapping(
  tickValues: number[],
  valueDecimals?: number
): {
  toSliderPercent: (val: number) => number;
  fromSliderPercent: (percent: number) => number;
} {
  const toSliderPercent = useCallback(
    (val: number): number => {
      for (let i = 0; i < tickValues.length - 1; i++) {
        const start = tickValues[i];
        const end = tickValues[i + 1];
        if (val >= start && val <= end) {
          const segmentStart = (i / (tickValues.length - 1)) * 100;
          const segmentEnd = ((i + 1) / (tickValues.length - 1)) * 100;
          const percentWithinSegment = (val - start) / (end - start);
          return segmentStart + percentWithinSegment * (segmentEnd - segmentStart);
        }
      }
      return val <= tickValues[0] ? 0 : 100;
    },
    [tickValues]
  );

  const fromSliderPercent = useCallback(
    (percent: number): number => {
      const totalSegments = tickValues.length - 1;
      const segmentSize = 100 / totalSegments;
      const segmentIndex = Math.min(Math.floor(percent / segmentSize), totalSegments - 1);
      const segmentStart = tickValues[segmentIndex];
      const segmentEnd = tickValues[segmentIndex + 1];
      const percentInSegment = (percent - segmentIndex * segmentSize) / segmentSize;
      const raw = segmentStart + percentInSegment * (segmentEnd - segmentStart);
      if (valueDecimals != null && valueDecimals >= 0) {
        const factor = 10 ** valueDecimals;
        return Math.round(raw * factor) / factor;
      }
      return Math.round(raw);
    },
    [tickValues, valueDecimals]
  );

  return { toSliderPercent, fromSliderPercent };
}
