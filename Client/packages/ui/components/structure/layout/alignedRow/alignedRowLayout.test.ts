import { describe, expect, it } from "vitest";

import {
  calculateElementWidths,
  getAlignedRowItemClassName,
  getAlignedRowItemStyle,
  isAlignedRowStacked,
} from "./alignedRowLayout";

describe("isAlignedRowStacked", () => {
  it("returns false when breakIntoRows is never", () => {
    expect(isAlignedRowStacked("never", 400)).toBe(false);
    expect(isAlignedRowStacked("never", undefined)).toBe(false);
  });

  it("returns undefined when container width is not measured", () => {
    expect(isAlignedRowStacked("sm", undefined)).toBeUndefined();
  });

  it("stacks below the sm breakpoint", () => {
    expect(isAlignedRowStacked("sm", 639)).toBe(true);
    expect(isAlignedRowStacked("sm", 640)).toBe(false);
  });
});

describe("getAlignedRowItemClassName", () => {
  it("uses flex-1 in row mode for equal-width items", () => {
    expect(getAlignedRowItemClassName("sm", 800)).toBe("min-w-0 flex-1");
    expect(getAlignedRowItemClassName("never", undefined)).toBe("min-w-0 flex-1");
  });

  it("uses full width in column mode", () => {
    expect(getAlignedRowItemClassName("sm", 500)).toBe("w-full min-w-0");
  });

  it("falls back to viewport-responsive classes before container is measured", () => {
    expect(getAlignedRowItemClassName("sm", undefined)).toBe("w-full min-w-0 sm:flex-1");
    expect(getAlignedRowItemClassName("md", undefined)).toBe("w-full min-w-0 md:flex-1");
  });
});

describe("getAlignedRowItemStyle", () => {
  it("returns no inline style for equal-width items", () => {
    expect(getAlignedRowItemStyle(50, "sm", 800, false)).toBeUndefined();
    expect(getAlignedRowItemStyle(50, "never", undefined, false)).toBeUndefined();
  });

  it("applies proportional flex for custom widths in row mode", () => {
    expect(getAlignedRowItemStyle(80, "never", undefined, true)).toEqual({ flex: "80 1 0" });
    expect(getAlignedRowItemStyle(20, "never", undefined, true)).toEqual({ flex: "20 1 0" });
    expect(getAlignedRowItemStyle(80, "sm", 800, true)).toEqual({ flex: "80 1 0" });
  });

  it("omits flex style when stacked in column mode", () => {
    expect(getAlignedRowItemStyle(80, "sm", 500, true)).toBeUndefined();
  });
});

describe("calculateElementWidths", () => {
  it("splits remaining width when custom widths are partial", () => {
    expect(calculateElementWidths(3, [80])).toEqual([80, 10, 10]);
  });

  it("distributes evenly when no custom widths", () => {
    expect(calculateElementWidths(2)).toEqual([50, 50]);
  });
});
