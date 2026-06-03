import { describe, expect, it } from "vitest";

import { buildPropertyDemographicsViewModel } from "./propertyDemographicsModel";

describe("buildPropertyDemographicsViewModel", () => {
  it("returns null when there is no demographics content and no rating", () => {
    expect(buildPropertyDemographicsViewModel(undefined)).toBeNull();
    expect(buildPropertyDemographicsViewModel({})).toBeNull();
  });

  it("returns a model when age_distribution is present", () => {
    const vm = buildPropertyDemographicsViewModel({
      age_distribution: { "18-34": "40%" },
    });
    expect(vm).not.toBeNull();
    expect(vm!.hasAgeDistribution).toBe(true);
    expect(vm!.sectionLabel.length).toBeGreaterThan(0);
  });

  it("keeps section rating when only rating fields remain after stripping distributions", () => {
    const vm = buildPropertyDemographicsViewModel({
      demographics_rating: "8",
    });
    expect(vm).not.toBeNull();
    expect(vm!.demographicsSectionRating).toBe(8);
    expect(vm!.hasAgeDistribution).toBe(false);
  });

  it("handles empty distribution maps", () => {
    const vm = buildPropertyDemographicsViewModel({
      age_distribution: {},
      race_distribution: {},
    });
    expect(vm).toBeNull();
  });

  it("builds model when income_distribution has values", () => {
    const vm = buildPropertyDemographicsViewModel({
      income_distribution: { "<50k": "30%", "50-100k": "40%" },
    });
    expect(vm).not.toBeNull();
    expect(vm!.hasIncomeDistribution).toBe(true);
  });
});
