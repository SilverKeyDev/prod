import { describe, expect, it } from "vitest";

import { DEMO_ELAPSED_FRACTION, paceProjectionLabel, projectedPacePercent } from "./paceProjection";

describe("paceProjection", () => {
  it("projects mid-period pace from actual vs target", () => {
    // 86% of target at 50% elapsed → ~172% of target run-rate
    expect(projectedPacePercent(86, 100, DEMO_ELAPSED_FRACTION)).toBe(172);
  });

  it("returns 0 for invalid inputs", () => {
    expect(projectedPacePercent(50, 0)).toBe(0);
    expect(projectedPacePercent(50, 100, 0)).toBe(0);
  });

  it("formats projection label", () => {
    expect(paceProjectionLabel(94)).toBe("At current pace → ~94% of target");
  });
});
