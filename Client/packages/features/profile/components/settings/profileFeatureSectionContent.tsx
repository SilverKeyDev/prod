import React from "react";

import { ProfileHousingEssentialsSection } from "packages/features/profile/components/profileScreen/sections/ProfileHousingEssentialsSection";
import { ProfileHousingRangesSection } from "packages/features/profile/components/profileScreen/sections/ProfileHousingRangesSection";
import { ProfileSearchPropertySection } from "packages/features/profile/components/profileScreen/sections/ProfileSearchPropertySection";
import {
  AgentBrokerageSection,
  AgentLicensingSection,
  AgentProfileServiceSection,
  AvailabilitySection,
  DemographicsSection,
  LocationSection,
  SettingsFinancialSection,
} from "packages/features/profile/components/sections/index.web";

import type { OnboardingData } from "@/features/profile/utils";

export type ProfileFeatureSectionContentProps = {
  sectionId: string;
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  patchBuyerPreferenceExtensions: (
    fn: (
      prev: OnboardingData["buyerPreferenceExtensions"]
    ) => NonNullable<OnboardingData["buyerPreferenceExtensions"]>
  ) => void;
  scriptsReady: boolean;
  loadError: string | null;
};

export function renderProfileFeatureSectionContent({
  sectionId,
  formData,
  isEditMode,
  updateFormData,
  patchBuyerPreferenceExtensions,
  scriptsReady,
  loadError,
}: ProfileFeatureSectionContentProps): React.ReactNode {
  switch (sectionId) {
    case "agent_brokerage":
      return (
        <AgentBrokerageSection
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={updateFormData}
        />
      );

    case "agent_licensing":
      return (
        <AgentLicensingSection
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={updateFormData}
        />
      );

    case "agent_profile":
      return (
        <AgentProfileServiceSection
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={updateFormData}
        />
      );

    case "demographics":
      return (
        <DemographicsSection
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={updateFormData}
          showAgentChoice={false}
        />
      );

    case "availability":
      return (
        <AvailabilitySection
          formData={formData}
          isEditMode={isEditMode}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />
      );

    case "financial":
      return (
        <SettingsFinancialSection
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={updateFormData}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />
      );

    case "housing_essentials":
      return (
        <ProfileHousingEssentialsSection
          formData={formData}
          isEditMode={isEditMode}
          updateField={(field, value) => updateFormData(field, value)}
        />
      );

    case "housing_ranges":
      return (
        <ProfileHousingRangesSection
          formData={formData}
          isEditMode={isEditMode}
          updateField={(field, value) => updateFormData(field, value)}
        />
      );

    case "location":
      return (
        <LocationSection
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={updateFormData}
          scriptsReady={scriptsReady}
          loadError={loadError}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />
      );

    case "search_property":
      return (
        <ProfileSearchPropertySection
          formData={formData}
          isEditMode={isEditMode}
          updateField={(field, value) => updateFormData(field, value)}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />
      );

    default:
      return null;
  }
}
