import React from "react";

import type { PatchBuyerPreferenceExtensions } from "packages/features/profile/components/profileScreen/searchPreferences/types";
import { ProfileHousingEssentialsSection } from "packages/features/profile/components/profileScreen/tabs/housing/ProfileHousingEssentialsSection";
import { ProfileHousingRangesSection } from "packages/features/profile/components/profileScreen/tabs/housing/ProfileHousingRangesSection";
import { AccountPrivacyDataSection } from "packages/features/profile/components/profileScreen/tabs/privacy/AccountPrivacyDataSection";
import { ProfileSearchPropertySection } from "packages/features/profile/components/profileScreen/tabs/search/ProfileSearchPropertySection";
import type { OnboardingData } from "packages/features/profile/utils";

import AgentBrokerageSection from "./AgentBrokerageSection";
import AgentLicensingSection from "./AgentLicensingSection";
import AgentProfileServiceSection from "./AgentProfileServiceSection";
import AvailabilitySection from "./AvailabilitySection";
import DemographicsSection, { type DemographicsPhotoProps } from "./DemographicsSection";
import { FinancialSection } from "./FinancialSection";
import LocationSection from "./LocationSection";

export type ProfileSectionSurface = "settings" | "profileScreen";

export type RenderProfileSectionContentProps = {
  sectionId: string;
  surface: ProfileSectionSurface;
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
  showAvailabilityEditor?: boolean;
  scriptsReady?: boolean;
  loadError?: string | null;
  agentSubject?: { userId: string; displayName: string } | null;
  photoProps?: DemographicsPhotoProps;
};

export function renderProfileSectionContent({
  sectionId,
  surface,
  formData,
  isEditMode,
  updateField,
  patchBuyerPreferenceExtensions,
  showAvailabilityEditor = false,
  scriptsReady,
  loadError,
  agentSubject = null,
  photoProps,
}: RenderProfileSectionContentProps): React.ReactNode {
  switch (sectionId) {
    case "agent_brokerage":
      return (
        <AgentBrokerageSection
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={updateField}
        />
      );

    case "agent_licensing":
      return (
        <AgentLicensingSection
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={updateField}
        />
      );

    case "agent_profile":
      return (
        <AgentProfileServiceSection
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={updateField}
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
          updateField={updateField}
          photoProps={surface === "profileScreen" ? photoProps : undefined}
        />
      );

    case "financial":
      return (
        <FinancialSection formData={formData} isEditMode={isEditMode} updateField={updateField} />
      );

    case "housing_essentials":
      return (
        <ProfileHousingEssentialsSection
          formData={formData}
          isEditMode={isEditMode}
          updateField={updateField}
        />
      );

    case "housing_ranges":
      return (
        <ProfileHousingRangesSection
          formData={formData}
          isEditMode={isEditMode}
          updateField={updateField}
        />
      );

    case "location":
      return (
        <LocationSection
          formData={formData}
          isEditMode={isEditMode}
          updateField={updateField}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
          scriptsReady={surface === "settings" ? scriptsReady : undefined}
          loadError={surface === "settings" ? loadError : undefined}
        />
      );

    case "search_property":
      return (
        <ProfileSearchPropertySection
          formData={formData}
          isEditMode={isEditMode}
          updateField={updateField}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />
      );

    case "privacy_data":
      return <AccountPrivacyDataSection agentSubject={agentSubject} />;

    default:
      return null;
  }
}
