import { describe, expect, it } from "vitest";

import { userPreferencesHasImportantLocations } from "./useSearchFeatureController.helpers";

describe("userPreferencesHasImportantLocations", () => {
  it("is false for missing or empty locations", () => {
    expect(userPreferencesHasImportantLocations(undefined)).toBe(false);
    expect(userPreferencesHasImportantLocations(null)).toBe(false);
    expect(userPreferencesHasImportantLocations([])).toBe(false);
    expect(userPreferencesHasImportantLocations("not-an-array")).toBe(false);
  });

  it("is true when at least one location entry exists", () => {
    expect(
      userPreferencesHasImportantLocations([{ address: "1 Main St", commute_tolerance: 30 }])
    ).toBe(true);
  });
});
