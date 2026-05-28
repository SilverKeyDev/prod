import { describe, expect, it } from "vitest";

import {
  getOnboardingSteps,
  getOnboardingStepsMobile,
} from "packages/features/profile/utils/onboarding/steps";

import { buildOnboardingFlowFromOptions } from "./buildProfileFlow";

function stepSnapshot(steps: { id: string; title: string }[]) {
  return steps.map((s) => ({ id: s.id, title: s.title }));
}

const BUYER_WEB_SNAPSHOT = [
  { id: "onboarding_role", title: "Who I am" },
  { id: "demographics", title: "About" },
  { id: "housing_essentials", title: "Essentials" },
  { id: "housing_ranges", title: "Size" },
  { id: "location", title: "Location" },
  { id: "search_property", title: "Features" },
  { id: "financial", title: "Finance" },
];

const BUYER_MOBILE_SNAPSHOT = BUYER_WEB_SNAPSHOT.filter((s) => s.id !== "financial");

const AGENT_SNAPSHOT = [
  { id: "onboarding_role", title: "Who I am" },
  { id: "demographics", title: "About" },
  { id: "agent_brokerage", title: "Brokerage" },
  { id: "agent_licensing", title: "Licensing" },
  { id: "agent_profile", title: "Territory" },
];

describe("onboarding flow snapshots (buyer and agent parity)", () => {
  it("buyer web — public API matches golden fixture", () => {
    expect(stepSnapshot(getOnboardingSteps({ primaryRole: "buyer" }))).toEqual(BUYER_WEB_SNAPSHOT);
  });

  it("buyer web — registry builder matches golden fixture", () => {
    expect(
      stepSnapshot(buildOnboardingFlowFromOptions({ primaryRole: "buyer", platform: "web" }))
    ).toEqual(BUYER_WEB_SNAPSHOT);
  });

  it("buyer mobile — public API matches golden fixture", () => {
    expect(stepSnapshot(getOnboardingStepsMobile({ primaryRole: "buyer" }))).toEqual(
      BUYER_MOBILE_SNAPSHOT
    );
  });

  it("buyer mobile — registry builder matches golden fixture", () => {
    expect(
      stepSnapshot(
        buildOnboardingFlowFromOptions({
          primaryRole: "buyer",
          excludeFinancial: true,
          platform: "mobile",
        })
      )
    ).toEqual(BUYER_MOBILE_SNAPSHOT);
  });

  it("agent web — public API matches golden fixture", () => {
    expect(stepSnapshot(getOnboardingSteps({ isAgent: true, primaryRole: "agent" }))).toEqual(
      AGENT_SNAPSHOT
    );
  });

  it("agent web — registry builder matches golden fixture", () => {
    expect(
      stepSnapshot(
        buildOnboardingFlowFromOptions({ isAgent: true, primaryRole: "agent", platform: "web" })
      )
    ).toEqual(AGENT_SNAPSHOT);
  });

  it("agent mobile — public API matches golden fixture", () => {
    expect(stepSnapshot(getOnboardingStepsMobile({ isAgent: true }))).toEqual(AGENT_SNAPSHOT);
  });
});
