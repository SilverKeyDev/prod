import { describe, expect, it } from "vitest";

import { getMapPinColorsForScoreAndStatus } from "./mapMatchPinColors";

describe("getMapPinColorsForScoreAndStatus", () => {
  it("uses explicit hex fills (not CSS vars)", () => {
    const c = getMapPinColorsForScoreAndStatus(90);
    expect(c.fillColor).toMatch(/^#/);
    expect(c.fillColor.startsWith("var(")).toBe(false);
  });

  it("differentiates adjacent tiers", () => {
    const poor = getMapPinColorsForScoreAndStatus(10);
    const weak = getMapPinColorsForScoreAndStatus(45);
    const fair = getMapPinColorsForScoreAndStatus(60);
    const strong = getMapPinColorsForScoreAndStatus(75);
    const excellent = getMapPinColorsForScoreAndStatus(92);

    expect(poor.fillColor).not.toBe(weak.fillColor);
    expect(weak.fillColor).not.toBe(fair.fillColor);
    expect(fair.fillColor).not.toBe(strong.fillColor);
    expect(strong.fillColor).not.toBe(excellent.fillColor);
  });

  it("excellent vs poor are clearly distinct", () => {
    const low = getMapPinColorsForScoreAndStatus(5);
    const high = getMapPinColorsForScoreAndStatus(95);
    expect(low.fillColor).not.toBe(high.fillColor);
    expect(low.strokeColor).not.toBe(high.strokeColor);
  });

  it("provides stroke colors distinct from fill", () => {
    const c = getMapPinColorsForScoreAndStatus(55);
    expect(c.strokeColor).toMatch(/^#/);
    expect(c.strokeColor).not.toBe(c.fillColor);
  });
});
