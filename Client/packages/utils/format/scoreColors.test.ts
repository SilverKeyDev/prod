import { describe, expect, it } from "vitest";

import { getMatchStyle } from "./matchScore";
import { getMatchScoreGradientColors, getScoreBasedColorForMap } from "./scoreColors";

describe("getMatchScoreGradientColors", () => {
  it("is constant within a tier band", () => {
    const a = getMatchScoreGradientColors(10);
    const b = getMatchScoreGradientColors(12);
    expect(a.fillColor).toBe(b.fillColor);
    expect(a.textColor).toBe(b.textColor);
  });

  it("changes when crossing a tier boundary", () => {
    const weak = getMatchScoreGradientColors(39);
    const fair = getMatchScoreGradientColors(55);
    expect(weak.fillColor).not.toBe(fair.fillColor);
  });

  it("excellent tier uses CSS var fill and token text hex", () => {
    const c = getMatchScoreGradientColors(90);
    expect(c.fillColor).toBe(getMatchStyle(90).bg);
    expect(c.textColor).toBe("#3D5240");
  });

  it("poor tier uses token text hex", () => {
    const c = getMatchScoreGradientColors(10);
    expect(c.textColor).toBe("#8C3D2A");
  });

  it("clamps scores beyond 0–100", () => {
    const top = getMatchScoreGradientColors(100);
    const over = getMatchScoreGradientColors(200);
    expect(top.fillColor).toBe(over.fillColor);
  });

  it("getScoreBasedColorForMap matches canonical helper", () => {
    expect(getScoreBasedColorForMap(37).fillColor).toBe(getMatchScoreGradientColors(37).fillColor);
  });
});
