import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSearchFilterControlsOverflow } from "./useSearchFilterControlsOverflow.web";

function createMeasuredElement(width: number): HTMLDivElement {
  const element = document.createElement("div");
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ width } as DOMRect);
  return element;
}

function renderMeasuredOverflow({
  chipWidths,
  containerWidth,
  moreWidth,
}: {
  chipWidths: number[];
  containerWidth: number;
  moreWidth: number;
}): number {
  const { rerender, result } = renderHook(
    ({ width }) => useSearchFilterControlsOverflow(width),
    { initialProps: { width: 0 } }
  );

  result.current.measureRefs.current = chipWidths.map(createMeasuredElement);
  result.current.measureRefMore.current = createMeasuredElement(moreWidth);

  rerender({ width: containerWidth });

  return result.current.overflowFromIndex;
}

describe("useSearchFilterControlsOverflow", () => {
  it("keeps all promoted filters visible when the container fits every chip and the More button", () => {
    expect(
      renderMeasuredOverflow({
        chipWidths: [50, 60, 70],
        containerWidth: 292,
        moreWidth: 80,
      })
    ).toBe(3);
  });

  it("moves chips after the last fitting filter into More when the container only has partial space", () => {
    expect(
      renderMeasuredOverflow({
        chipWidths: [50, 60, 70],
        containerWidth: 214,
        moreWidth: 80,
      })
    ).toBe(2);
  });

  it("keeps all promoted filters in More when only the More button fits", () => {
    expect(
      renderMeasuredOverflow({
        chipWidths: [50, 60, 70],
        containerWidth: 88,
        moreWidth: 80,
      })
    ).toBe(0);
  });

  it("retains the default overflow state until valid measurements are available", () => {
    expect(
      renderMeasuredOverflow({
        chipWidths: [50, 60, 70],
        containerWidth: 500,
        moreWidth: 0,
      })
    ).toBe(3);
  });
});
