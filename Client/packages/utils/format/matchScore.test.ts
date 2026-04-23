import { describe, expect, it } from "vitest";

import { clampMatchScore, getMatchStyle, getMatchTier, getMatchTierIndex } from "./matchScore";

describe("getMatchStyle", () => {
  it("returns CSS var bg/fg and short label", () => {
    const s = getMatchStyle(90);
    expect(s.tier).toBe("excellent");
    expect(s.label).toBe("Excellent");
    expect(s.bg).toBe("var(--match-excellent-bg)");
    expect(s.fg).toBe("var(--match-excellent-fg)");
  });

  it("uses >= thresholds (85 is excellent)", () => {
    expect(getMatchStyle(85).tier).toBe("excellent");
    expect(getMatchStyle(84).tier).toBe("strong");
  });

  it("maps Option A bands", () => {
    expect(getMatchStyle(100).tier).toBe("excellent");
    expect(getMatchStyle(70).tier).toBe("strong");
    expect(getMatchStyle(69).tier).toBe("fair");
    expect(getMatchStyle(55).tier).toBe("fair");
    expect(getMatchStyle(54).tier).toBe("weak");
    expect(getMatchStyle(40).tier).toBe("weak");
    expect(getMatchStyle(39).tier).toBe("poor");
    expect(getMatchStyle(0).tier).toBe("poor");
  });

  it("clamps to 0–100", () => {
    expect(getMatchStyle(-5).tier).toBe("poor");
    expect(getMatchStyle(200).tier).toBe("excellent");
  });
});

describe("getMatchTier", () => {
  it("matches getMatchStyle(score).tier", () => {
    expect(getMatchTier(72)).toBe(getMatchStyle(72).tier);
  });
});

describe("clampMatchScore", () => {
  it("clamps and rejects non-finite", () => {
    expect(clampMatchScore(NaN)).toBe(0);
    expect(clampMatchScore(150)).toBe(100);
    expect(clampMatchScore(-1)).toBe(0);
  });
});

describe("getMatchTierIndex", () => {
  it("is monotonic 0..4", () => {
    expect(getMatchTierIndex(0)).toBe(0);
    expect(getMatchTierIndex(100)).toBe(4);
    expect(getMatchTierIndex(39)).toBe(0);
    expect(getMatchTierIndex(40)).toBe(1);
    expect(getMatchTierIndex(85)).toBe(4);
  });
});
