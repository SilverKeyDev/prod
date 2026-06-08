import { spacing } from "packages/design-tokens";

/** Hit area height must be at least thumb size (1.25rem) so the full thumb is clickable. */
export const RANGE_SLIDER_HIT_HEIGHT = spacing(6);

const THUMB_CLASS_BASE =
  "sk-range-slider-thumb pointer-events-none absolute h-full w-full touch-manipulation appearance-none rounded-lg bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto";

export function getRangeSliderThumbClass(disabled: boolean): string {
  return `${THUMB_CLASS_BASE} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`;
}
