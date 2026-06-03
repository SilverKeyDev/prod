import { describe, expect, it } from "vitest";

import {
  deduplicateFeatures,
  isFeatures,
  isImageFeatures,
  sanitizeCategoryFeatures,
} from "./propertyFeaturesHelpers";

describe("isImageFeatures", () => {
  it("accepts objects with clean string array", () => {
    expect(isImageFeatures({ clean: ["pool"] })).toBe(true);
    expect(isImageFeatures({ clean: [] })).toBe(true);
    expect(isImageFeatures({})).toBe(false);
  });
});

describe("isFeatures", () => {
  it("accepts category maps of string arrays", () => {
    expect(isFeatures({ kitchen: ["granite"] })).toBe(true);
    expect(isFeatures({ kitchen: [1] })).toBe(false);
  });
});

describe("deduplicateFeatures", () => {
  it("removes duplicates, empty strings, and noise tokens", () => {
    expect(deduplicateFeatures(["Pool", " pool ", "", "N/A", "Garage", "garage"])).toEqual([
      "Pool",
      "Garage",
    ]);
  });
});

describe("sanitizeCategoryFeatures", () => {
  it("drops architectural_style and empty categories", () => {
    const result = sanitizeCategoryFeatures({
      architectural_style: ["Colonial"],
      kitchen: ["Granite counters", "N/A"],
      empty: ["", "  "],
    });
    expect(result).toEqual({ kitchen: ["Granite counters"] });
  });
});
