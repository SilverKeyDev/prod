import { describe, expect, it } from "vitest";

import {
  getPropertyDetailsExcludeSections,
  shouldHideStandaloneLocationMap,
  shouldShowListingAgentSkeleton,
} from "./propertyDetailsSectionLayout";

describe("shouldHideStandaloneLocationMap", () => {
  it("returns false when commute_data has no travel times", () => {
    expect(shouldHideStandaloneLocationMap({})).toBe(false);
    expect(shouldHideStandaloneLocationMap({ commute_data: { travel_times: [] } })).toBe(false);
  });

  it("returns true when commute_data has travel times", () => {
    expect(
      shouldHideStandaloneLocationMap({
        commute_data: { travel_times: [{ minutes: 15 }] },
      })
    ).toBe(true);
  });
});

describe("getPropertyDetailsExcludeSections", () => {
  it("returns empty when no location or analysis subsections apply", () => {
    expect(
      getPropertyDetailsExcludeSections({
        property: {},
        propertyAnalysis: {},
      })
    ).toEqual([]);
  });

  it("excludes commute when commute_data or commute analysis is present", () => {
    expect(
      getPropertyDetailsExcludeSections({
        property: { commute_data: {} },
        hasCommute: true,
      })
    ).toContain("commute");

    expect(
      getPropertyDetailsExcludeSections({
        property: {},
        commuteAnalysis: { summary: "ok" },
      })
    ).toContain("commute");
  });

  it("excludes family_friendly when schools analysis exists", () => {
    expect(
      getPropertyDetailsExcludeSections({
        property: {},
        familyFriendlyAnalysis: { schools: [] },
      })
    ).toEqual(["family_friendly"]);
  });

  it("excludes neighborhood and demographics keys when neighborhood payload exists", () => {
    const excluded = getPropertyDetailsExcludeSections({
      property: {},
      propertyAnalysis: { neighborhood: { summary: "Walkable" } },
    });
    expect(excluded).toContain("neighborhood");
    expect(excluded).toContain("demographics");
    expect(excluded).toContain("age_distribution");
  });

  it("excludes climate_environmental_safety when environmental content exists", () => {
    const excluded = getPropertyDetailsExcludeSections({
      property: {},
      propertyAnalysis: {
        climate_environmental_safety: { climate: "Mild." },
      },
    });
    expect(excluded).toContain("climate_environmental_safety");
  });
});

describe("shouldShowListingAgentSkeleton", () => {
  it("shows skeleton only while loading without agent data", () => {
    expect(shouldShowListingAgentSkeleton(true, { hasAgent: false })).toBe(true);
    expect(shouldShowListingAgentSkeleton(true, { hasAgent: true })).toBe(false);
    expect(shouldShowListingAgentSkeleton(false, { hasAgent: false })).toBe(false);
  });
});
