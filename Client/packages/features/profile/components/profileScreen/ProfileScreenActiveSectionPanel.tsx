import React from "react";

import { PersonalizationSectionPanel } from "packages/features/profile/components/layout";
import { AccountPrivacyDataSection } from "packages/features/profile/components/profileScreen/sections/AccountPrivacyDataSection";
import { ProfileDemographicsSection } from "packages/features/profile/components/profileScreen/sections/ProfileDemographicsSection";
import { ProfileFinancialSection } from "packages/features/profile/components/profileScreen/sections/ProfileFinancialSection";
import { ProfileHousingEssentialsSection } from "packages/features/profile/components/profileScreen/sections/ProfileHousingEssentialsSection";
import { ProfileHousingRangesSection } from "packages/features/profile/components/profileScreen/sections/ProfileHousingRangesSection";
import { ProfileLocationSection } from "packages/features/profile/components/profileScreen/sections/ProfileLocationSection";
import { ProfileSearchPropertySection } from "packages/features/profile/components/profileScreen/sections/ProfileSearchPropertySection";
import {
  AgentBrokerageSection,
  AgentLicensingSection,
  AgentProfileServiceSection,
  AvailabilitySection,
} from "packages/features/profile/components/sections";
import type { OnboardingData } from "packages/features/profile/utils";

export type ProfileScreenActiveSectionPanelProps = {
  currentStep: { id: string; title: string } | undefined;
  activeSection: string;
  effectiveEditMode: boolean;
  formData: OnboardingData;
  /** When set, privacy self-service is hidden. */
  agentSubject?: { userId: string; displayName: string } | null;
  userProfile: { name?: string | null; profile_picture_url?: string | null } | null | undefined;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
  patchBuyerPreferenceExtensions: (
    fn: (
      prev: OnboardingData["buyerPreferenceExtensions"]
    ) => NonNullable<OnboardingData["buyerPreferenceExtensions"]>
  ) => void;
  onChangeProfilePhoto: () => void;
  isUploadingProfilePicture: boolean;
  profilePictureError: Error | null;
};

export function ProfileScreenActiveSectionPanel({
  currentStep,
  activeSection,
  effectiveEditMode,
  formData,
  agentSubject = null,
  userProfile,
  updateField,
  patchBuyerPreferenceExtensions,
  onChangeProfilePhoto,
  isUploadingProfilePicture,
  profilePictureError,
}: ProfileScreenActiveSectionPanelProps) {
  if (!currentStep) {
    return null;
  }

  return (
    <PersonalizationSectionPanel
      sectionId={currentStep.id}
      screenReaderHeading={currentStep.title}
      showVisibleHeading={activeSection !== "location"}
    >
      {activeSection === "agent_brokerage" && (
        <AgentBrokerageSection
          formData={formData}
          isEditMode={effectiveEditMode}
          updateFormData={updateField}
        />
      )}
      {activeSection === "agent_licensing" && (
        <AgentLicensingSection
          formData={formData}
          isEditMode={effectiveEditMode}
          updateFormData={updateField}
        />
      )}
      {activeSection === "agent_profile" && (
        <AgentProfileServiceSection
          formData={formData}
          isEditMode={effectiveEditMode}
          updateFormData={updateField}
        />
      )}
      {activeSection === "availability" && (
        <AvailabilitySection
          formData={formData}
          isEditMode={effectiveEditMode}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />
      )}
      {activeSection === "demographics" && (
        <ProfileDemographicsSection
          formData={formData}
          isEditMode={effectiveEditMode}
          updateField={updateField}
          profilePictureUrl={agentSubject != null ? undefined : userProfile?.profile_picture_url}
          onUploadPhoto={agentSubject != null ? undefined : onChangeProfilePhoto}
          isUploadingProfilePicture={agentSubject != null ? false : isUploadingProfilePicture}
          profilePictureError={
            agentSubject != null
              ? null
              : profilePictureError != null
                ? { message: profilePictureError.message }
                : null
          }
          userDisplayName={agentSubject?.displayName ?? userProfile?.name}
        />
      )}
      {activeSection === "financial" && (
        <ProfileFinancialSection
          formData={formData}
          isEditMode={effectiveEditMode}
          updateField={updateField}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />
      )}
      {activeSection === "location" && (
        <ProfileLocationSection
          formData={formData}
          isEditMode={effectiveEditMode}
          updateField={updateField}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />
      )}
      {activeSection === "housing_essentials" && (
        <ProfileHousingEssentialsSection
          formData={formData}
          isEditMode={effectiveEditMode}
          updateField={updateField}
        />
      )}
      {activeSection === "housing_ranges" && (
        <ProfileHousingRangesSection
          formData={formData}
          isEditMode={effectiveEditMode}
          updateField={updateField}
        />
      )}
      {activeSection === "search_property" && (
        <ProfileSearchPropertySection
          formData={formData}
          isEditMode={effectiveEditMode}
          updateField={updateField}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />
      )}
      {activeSection === "privacy_data" && (
        <AccountPrivacyDataSection agentSubject={agentSubject} />
      )}
    </PersonalizationSectionPanel>
  );
}
