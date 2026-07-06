import React from "react";

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { OnboardingData } from "packages/features/profile/utils";

import { renderOnboardingStep } from "./renderOnboardingStep.web";

vi.mock("packages/features/profile/components/onboarding/buyer", () => ({
  BuyerAboutMeStepContent: () => <div data-testid="buyer-about-me" />,
  BuyerFinancingStepContent: () => <div data-testid="buyer-financing" />,
}));

vi.mock("packages/features/profile/components/formSections/index.web", () => ({
  DemographicsSection: () => <div data-testid="agent-demographics" />,
  AgentBrokerageSection: () => <div data-testid="agent-brokerage" />,
  AgentLicensingSection: () => <div data-testid="agent-licensing" />,
  AgentProfileServiceSection: () => <div data-testid="agent-profile" />,
  LocationSection: () => <div data-testid="location-section" />,
}));

vi.mock("packages/features/profile/components/onboarding/OnboardingRoleStep.web", () => ({
  default: () => <div data-testid="onboarding-role" />,
}));

const baseFormData = {
  primary_onboarding_role: "buyer",
  why_joining_silverkey: ["buying_house"],
} as OnboardingData;

const baseProps = {
  formData: baseFormData,
  updateFormData: vi.fn(),
  patchBuyerPreferenceExtensions: vi.fn(),
};

describe("renderOnboardingStep.web", () => {
  it("renders buyer about-me for demographics step", () => {
    const { getByTestId } = render(
      renderOnboardingStep({ ...baseProps, stepId: "demographics" }) as React.ReactElement
    );
    expect(getByTestId("buyer-about-me")).toBeTruthy();
  });

  it("renders buyer financing for financial step", () => {
    const { getByTestId } = render(
      renderOnboardingStep({ ...baseProps, stepId: "financial" }) as React.ReactElement
    );
    expect(getByTestId("buyer-financing")).toBeTruthy();
  });

  it("renders agent demographics for non-buyer demographics step", () => {
    const { getByTestId } = render(
      renderOnboardingStep({
        ...baseProps,
        stepId: "demographics",
        formData: {
          primary_onboarding_role: "agent",
          why_joining_silverkey: ["agent"],
        } as OnboardingData,
      }) as React.ReactElement
    );
    expect(getByTestId("agent-demographics")).toBeTruthy();
  });
});
