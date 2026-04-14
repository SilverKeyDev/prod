import { describe, expect, it } from "vitest";

import { getScoreBasedColor } from "./scoreColors";

describe("getScoreBasedColor", () => {
  it("uses five discrete steps (same color within a 20-point band)", () => {
    const a = getScoreBasedColor(0);
    const b = getScoreBasedColor(19.99);
    expect(a.fillColor).toBe(b.fillColor);
  });

  it("steps up at the 20-point boundary", () => {
    const low = getScoreBasedColor(19);
    const high = getScoreBasedColor(20);
    expect(low.fillColor).not.toBe(high.fillColor);
  });

  it("clamps scores above 100 to the top step", () => {
    const top = getScoreBasedColor(100);
    const over = getScoreBasedColor(150);
    expect(top.fillColor).toBe(over.fillColor);
  });

  it("clamps negative scores to the bottom step", () => {
    const bottom = getScoreBasedColor(0);
    const under = getScoreBasedColor(-10);
    expect(bottom.fillColor).toBe(under.fillColor);
  });
});
