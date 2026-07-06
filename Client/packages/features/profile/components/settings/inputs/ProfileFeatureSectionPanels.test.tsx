import React from "react";

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { OnboardingData } from "packages/features/profile/utils";

import { ProfileFeatureSectionPanels } from "./ProfileFeatureSectionPanels";

vi.mock("packages/features/profile/components/formSections/renderProfileSectionContent", () => ({
  renderProfileSectionContent: vi.fn(
    ({
      sectionId,
      surface,
      isEditMode,
    }: {
      sectionId: string;
      surface: string;
      isEditMode: boolean;
    }) => (
      <div
        data-testid={`section-${sectionId}`}
        data-surface={surface}
        data-edit-mode={String(isEditMode)}
      />
    )
  ),
}));

vi.mock(
  "packages/features/profile/components/profileScreen/tabs/privacy/AgentPublicProfileShareRow",
  () => ({
    AgentPublicProfileShareRow: () => <div data-testid="agent-share-row" />,
  })
);

const baseProps = {
  agentSubject: null,
  isUltraSmallScreen: false,
  showAgentPublicProfileShare: false,
  agentPublicProfileUserId: "",
  agentPublicProfileDisplayName: null,
  steps: [
    { id: "demographics", title: "About me" },
    { id: "financial", title: "Finances" },
  ] as const,
  formData: { primary_onboarding_role: "buyer" } as OnboardingData,
  isEditMode: true,
  updateFormData: vi.fn(),
  patchBuyerPreferenceExtensions: vi.fn(),
  scriptsReady: true,
  loadError: null,
  showAvailabilityEditor: false,
};

describe("ProfileFeatureSectionPanels", () => {
  it("renders a panel per step with settings surface", () => {
    const { getByTestId } = render(<ProfileFeatureSectionPanels {...baseProps} />);
    const demographics = getByTestId("section-demographics");
    expect(demographics.getAttribute("data-surface")).toBe("settings");
    expect(getByTestId("section-financial")).toBeTruthy();
  });

  it("forces read-only when viewing an agent subject profile", () => {
    const { getByTestId } = render(
      <ProfileFeatureSectionPanels
        {...baseProps}
        agentSubject={{ userId: "client-1", displayName: "Client" }}
        isEditMode={true}
      />
    );
    expect(getByTestId("section-demographics").getAttribute("data-edit-mode")).toBe("false");
  });

  it("shows agent public profile share row when enabled", () => {
    const { getByTestId } = render(
      <ProfileFeatureSectionPanels
        {...baseProps}
        showAgentPublicProfileShare={true}
        agentPublicProfileUserId="agent-1"
        agentPublicProfileDisplayName="Agent Alex"
      />
    );
    expect(getByTestId("agent-share-row")).toBeTruthy();
  });
});
