import { describe, expect, it } from "vitest";

import {
  hasEnvironmentalFactorsContent,
  parseEnvironmentalSection,
} from "packages/utils/propertyDetails";

describe("hasEnvironmentalFactorsContent", () => {
  it("returns false for null, non-object, or empty values", () => {
    expect(hasEnvironmentalFactorsContent(null)).toBe(false);
    expect(hasEnvironmentalFactorsContent(undefined)).toBe(false);
    expect(hasEnvironmentalFactorsContent([])).toBe(false);
    expect(hasEnvironmentalFactorsContent({})).toBe(false);
    expect(hasEnvironmentalFactorsContent({ climate: "" })).toBe(false);
  });

  it("returns true when any string field is non-empty", () => {
    expect(hasEnvironmentalFactorsContent({ climate: "Mild winters." })).toBe(true);
  });

  it("returns true when any score field is present", () => {
    expect(hasEnvironmentalFactorsContent({ noise_pollution_score: 8 })).toBe(true);
  });

  it("unwraps single-key climate_environmental_safety wrapper", () => {
    expect(
      hasEnvironmentalFactorsContent({
        climate_environmental_safety: { flood_risk: "Low." },
      })
    ).toBe(true);
  });
});

describe("parseEnvironmentalSection", () => {
  it("returns null for invalid input", () => {
    expect(parseEnvironmentalSection(null)).toBeNull();
    expect(parseEnvironmentalSection("x")).toBeNull();
  });

  it("parses climate_rating into headerRating and strips from prose", () => {
    const parsed = parseEnvironmentalSection({
      climate_rating: "8.5",
      climate: "Temperate.",
      noise_pollution_score: 7,
      fire_score: "9/10",
    });
    expect(parsed?.headerRating).toBe(8.5);
    expect(parsed?.factors.find((f) => f.key === "noise_pollution_score")?.rating).toBe(7);
    expect(parsed?.factors.find((f) => f.key === "fire_score")?.rating).toBe(9);
    expect(parsed?.prose).toEqual([{ fieldKey: "climate", text: "Temperate." }]);
  });

  it("includes legacy narrative fields in prose only", () => {
    const parsed = parseEnvironmentalSection({
      climate_rating: "7",
      flood_risk: "Zone A.",
      fire_risk: "Moderate.",
      hurricane_risk: "Low.",
      environmental_safety: "Good air.",
    });
    expect(parsed?.prose.map((p) => p.fieldKey).sort()).toEqual([
      "environmental_safety",
      "fire_risk",
      "flood_risk",
      "hurricane_risk",
    ]);
  });

  it("unwraps nested section shape", () => {
    const parsed = parseEnvironmentalSection({
      climate_environmental_safety: {
        climate_rating: "6",
        wind_score: 5,
      },
    });
    expect(parsed?.headerRating).toBe(6);
    expect(parsed?.factors.find((f) => f.key === "wind_score")?.rating).toBe(5);
  });
});
