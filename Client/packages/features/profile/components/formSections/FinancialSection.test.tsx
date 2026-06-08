import React from "react";

import { describe, expect, it, vi } from "vitest";

import type { OnboardingData } from "packages/features/profile/utils";

import { FinancialSection } from "./FinancialSection";

vi.mock("packages/features/profile/components/layout", () => ({
  ProfileSectionBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useShowPersonalizationSectionBodyTitle: () => false,
}));

vi.mock("packages/features/profile/components/onboarding/buyer", () => ({
  BuyerFinancingStepContent: () => <div data-testid="buyer-financing" />,
}));

vi.mock("packages/features/profile/utils/onboarding/role/onboardingRoleSelection", () => ({
  shouldShowBuyerOnboardingUi: (formData: OnboardingData) =>
    formData.primary_onboarding_role === "buyer",
}));

describe("FinancialSection", () => {
  it("returns null for non-buyer profiles", () => {
    const result = FinancialSection({
      formData: { primary_onboarding_role: "agent" },
      isEditMode: true,
      updateField: vi.fn(),
    });
    expect(result).toBeNull();
  });
});
