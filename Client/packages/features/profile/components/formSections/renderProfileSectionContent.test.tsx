import React from "react";

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { OnboardingData } from "packages/features/profile/utils";

import { renderProfileSectionContent } from "./renderProfileSectionContent";

vi.mock("packages/features/profile/components/formSections/DemographicsSection", () => ({
  default: ({ photoProps }: { photoProps?: { userDisplayName: string } }) => (
    <div data-testid="demographics-section" data-photo={photoProps?.userDisplayName ?? ""} />
  ),
}));

vi.mock("packages/features/profile/components/formSections/FinancialSection", () => ({
  FinancialSection: () => <div data-testid="financial-section" />,
}));

vi.mock("packages/features/profile/components/formSections/AvailabilitySection", () => ({
  default: () => <div data-testid="availability-section" />,
}));

vi.mock("packages/features/profile/components/formSections/LocationSection", () => ({
  default: ({ scriptsReady, loadError }: { scriptsReady?: boolean; loadError?: string | null }) => (
    <div
      data-testid="location-section"
      data-scripts-ready={String(scriptsReady)}
      data-load-error={loadError ?? ""}
    />
  ),
}));

vi.mock(
  "packages/features/profile/components/profileScreen/tabs/housing/ProfileHousingEssentialsSection",
  () => ({
    ProfileHousingEssentialsSection: () => <div data-testid="housing-essentials-section" />,
  })
);

vi.mock(
  "packages/features/profile/components/profileScreen/tabs/privacy/AccountPrivacyDataSection",
  () => ({
    AccountPrivacyDataSection: () => <div data-testid="privacy-section" />,
  })
);

const baseProps = {
  formData: { primary_onboarding_role: "buyer" } as OnboardingData,
  isEditMode: true,
  updateField: vi.fn(),
  patchBuyerPreferenceExtensions: vi.fn(),
};

describe("renderProfileSectionContent", () => {
  it("returns null for availability when showAvailabilityEditor is false", () => {
    const node = renderProfileSectionContent({
      ...baseProps,
      sectionId: "availability",
      surface: "settings",
      showAvailabilityEditor: false,
    });
    expect(node).toBeNull();
  });

  it("renders availability when showAvailabilityEditor is true", () => {
    const { getByTestId } = render(
      renderProfileSectionContent({
        ...baseProps,
        sectionId: "availability",
        surface: "settings",
        showAvailabilityEditor: true,
      }) as React.ReactElement
    );
    expect(getByTestId("availability-section")).toBeTruthy();
  });

  it("passes photoProps on profileScreen demographics surface", () => {
    const { getByTestId } = render(
      renderProfileSectionContent({
        ...baseProps,
        sectionId: "demographics",
        surface: "profileScreen",
        photoProps: { userDisplayName: "Alex" },
      }) as React.ReactElement
    );
    expect(getByTestId("demographics-section").getAttribute("data-photo")).toBe("Alex");
  });

  it("omits photoProps on settings demographics surface", () => {
    const { getByTestId } = render(
      renderProfileSectionContent({
        ...baseProps,
        sectionId: "demographics",
        surface: "settings",
        photoProps: { userDisplayName: "Alex" },
      }) as React.ReactElement
    );
    expect(getByTestId("demographics-section").getAttribute("data-photo")).toBe("");
  });

  it("passes scriptsReady and loadError to location on settings surface", () => {
    const { getByTestId } = render(
      renderProfileSectionContent({
        ...baseProps,
        sectionId: "location",
        surface: "settings",
        scriptsReady: true,
        loadError: "Maps failed",
      }) as React.ReactElement
    );
    const el = getByTestId("location-section");
    expect(el.getAttribute("data-scripts-ready")).toBe("true");
    expect(el.getAttribute("data-load-error")).toBe("Maps failed");
  });

  it("renders financial, housing essentials, and privacy sections", () => {
    const financial = render(
      renderProfileSectionContent({
        ...baseProps,
        sectionId: "financial",
        surface: "settings",
      }) as React.ReactElement
    );
    expect(financial.getByTestId("financial-section")).toBeTruthy();

    const housing = render(
      renderProfileSectionContent({
        ...baseProps,
        sectionId: "housing_essentials",
        surface: "settings",
      }) as React.ReactElement
    );
    expect(housing.getByTestId("housing-essentials-section")).toBeTruthy();

    const privacy = render(
      renderProfileSectionContent({
        ...baseProps,
        sectionId: "privacy_data",
        surface: "settings",
      }) as React.ReactElement
    );
    expect(privacy.getByTestId("privacy-section")).toBeTruthy();
  });

  it("returns null for unknown section ids", () => {
    const node = renderProfileSectionContent({
      ...baseProps,
      sectionId: "unknown_section",
      surface: "settings",
    });
    expect(node).toBeNull();
  });
});
