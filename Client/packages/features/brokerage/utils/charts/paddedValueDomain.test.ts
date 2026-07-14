import { describe, expect, it } from "vitest";

import { paddedValueDomain } from "packages/features/brokerage/utils/charts/paddedValueDomain";

describe("paddedValueDomain", () => {
  it("returns a default domain for empty values", () => {
    expect(paddedValueDomain([])).toEqual({ min: 0, max: 1 });
  });

  it("pads below min and pins max to data max for a narrow high band", () => {
    expect(paddedValueDomain([55, 60, 65])).toEqual({
      min: 54,
      max: 65,
    });
  });

  it("floors padded min for a flat series", () => {
    expect(paddedValueDomain([42, 42, 42])).toEqual({
      min: 39,
      max: 42,
    });
  });

  it("clamps min at 0 instead of going negative", () => {
    expect(paddedValueDomain([0, 0])).toEqual({
      min: 0,
      max: 1,
    });
  });

  it("clamps padded min at 0 for near-zero data", () => {
    expect(paddedValueDomain([1, 2, 3])).toEqual({
      min: 0,
      max: 3,
    });
  });

  it("uses multi-series extremes across all values", () => {
    expect(paddedValueDomain([10, 12, 50, 48])).toEqual({
      min: 6,
      max: 50,
    });
  });

  it("handles a single value with rounded cutoffs", () => {
    expect(paddedValueDomain([100])).toEqual({
      min: 95,
      max: 100,
    });
  });

  it("rounds fractional cutoffs to integers", () => {
    expect(paddedValueDomain([55.3, 60.7])).toEqual({
      min: 54,
      max: 61,
    });
  });
});
