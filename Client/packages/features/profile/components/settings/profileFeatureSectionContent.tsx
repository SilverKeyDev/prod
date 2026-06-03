import React from "react";

import { ProfileHousingEssentialsSection } from "packages/features/profile/components/profileScreen/sections/housing/ProfileHousingEssentialsSection";
import { ProfileHousingRangesSection } from "packages/features/profile/components/profileScreen/sections/housing/ProfileHousingRangesSection";
import { AccountPrivacyDataSection } from "packages/features/profile/components/profileScreen/sections/privacy/AccountPrivacyDataSection";
import { ProfileSearchPropertySection } from "packages/features/profile/components/profileScreen/sections/search/ProfileSearchPropertySection";
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
  /** When viewing another user’s profile, hide self-service privacy tools. */
  agentSubject?: { userId: string; displayName: string } | null;
  /** Agent-only: show weekly availability editor in profile settings. */
  showAvailabilityEditor: boolean;
};

export function renderProfileFeatureSectionContent({
  sectionId,
  formData,
  isEditMode,
  updateFormData,
  patchBuyerPreferenceExtensions,
  scriptsReady,
  loadError,
  agentSubject = null,
  showAvailabilityEditor,
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

    case "availability":
      if (!showAvailabilityEditor) return null;
      return (
        <AvailabilitySection
          formData={formData}
          isEditMode={isEditMode}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />
      );

    case "demographics":
      return (
        <DemographicsSection
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={updateFormData}
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

    case "privacy_data":
      return <AccountPrivacyDataSection agentSubject={agentSubject} />;

    default:
      return null;
  }
}
