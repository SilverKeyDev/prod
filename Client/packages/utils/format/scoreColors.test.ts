import { describe, expect, it } from "vitest";

import { getScoreBasedColor, getScoreBasedColorForMap } from "./scoreColors";

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

describe("getScoreBasedColorForMap", () => {
  it("ramps continuously (adjacent scores can differ within a former 20-point band)", () => {
    const a = getScoreBasedColorForMap(10);
    const b = getScoreBasedColorForMap(11);
    expect(a.fillColor).not.toBe(b.fillColor);
  });

  it("low scores are much more muted than high scores", () => {
    const low = getScoreBasedColorForMap(0).fillColor;
    const high = getScoreBasedColorForMap(100).fillColor;
    expect(low).not.toBe(high);
  });

  it("clamps like the UI scale", () => {
    const top = getScoreBasedColorForMap(100);
    const over = getScoreBasedColorForMap(200);
    expect(top.fillColor).toBe(over.fillColor);
  });
});
