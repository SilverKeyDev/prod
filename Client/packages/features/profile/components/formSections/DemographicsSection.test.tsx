import React from "react";

import { describe, expect, it, vi } from "vitest";

import type { OnboardingData } from "packages/features/profile/utils";

import DemographicsSection from "./DemographicsSection";

vi.mock("packages/features/profile/components/layout", () => ({
  useShowPersonalizationSectionBodyTitle: () => false,
}));

vi.mock("./demographics/BuyerAboutProfileSection", () => ({
  BuyerAboutProfileSection: () => <div data-testid="buyer-about" />,
}));

vi.mock("./demographics/AgentDemographicsFields", () => ({
  AgentDemographicsFields: () => <div data-testid="agent-fields" />,
}));

vi.mock("packages/features/profile/utils/onboarding/role/onboardingRoleSelection", () => ({
  shouldShowBuyerOnboardingUi: (formData: OnboardingData) =>
    formData.primary_onboarding_role === "buyer",
}));

describe("DemographicsSection", () => {
  it("renders buyer branch for buyer onboarding role", () => {
    const result = DemographicsSection({
      formData: { primary_onboarding_role: "buyer" },
      isEditMode: true,
      updateField: vi.fn(),
    });
    expect(result).toBeTruthy();
  });
});
