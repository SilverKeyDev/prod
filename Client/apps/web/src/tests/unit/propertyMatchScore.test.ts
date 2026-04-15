import { describe, expect, it } from "vitest";

import {
  getPropertyMatchScore,
  isListingFullCriteriaMatch,
} from "packages/utils/search/propertyMatchScore";

describe("getPropertyMatchScore", () => {
  it("returns 0 when _score is missing or invalid", () => {
    expect(getPropertyMatchScore({})).toBe(0);
    expect(getPropertyMatchScore({ _score: null })).toBe(0);
    expect(getPropertyMatchScore({ _score: NaN })).toBe(0);
  });

  it("returns numeric _score when finite", () => {
    expect(getPropertyMatchScore({ _score: 72.5 })).toBe(72.5);
  });
});

describe("isListingFullCriteriaMatch", () => {
  it("is false when _score is missing or not finite", () => {
    expect(isListingFullCriteriaMatch({})).toBe(false);
    expect(isListingFullCriteriaMatch({ _score: null })).toBe(false);
    expect(isListingFullCriteriaMatch({ _score: NaN })).toBe(false);
  });

  it("is true at MCDA display ceiling (~99)", () => {
    expect(isListingFullCriteriaMatch({ _score: 99 })).toBe(true);
    expect(isListingFullCriteriaMatch({ _score: 98.96 })).toBe(true);
  });

  it("is false below MCDA ceiling", () => {
    expect(isListingFullCriteriaMatch({ _score: 98 })).toBe(false);
    expect(isListingFullCriteriaMatch({ _score: 50 })).toBe(false);
  });

  it("accepts legacy 0–100 scale at top", () => {
    expect(isListingFullCriteriaMatch({ _score: 100 })).toBe(true);
    expect(isListingFullCriteriaMatch({ _score: 99.6 })).toBe(true);
    expect(isListingFullCriteriaMatch({ _score: 99.4 })).toBe(false);
  });
});
