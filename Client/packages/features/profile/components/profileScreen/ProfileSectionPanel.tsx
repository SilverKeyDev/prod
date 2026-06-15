import React from "react";

import { renderProfileSectionContent } from "packages/features/profile/components/formSections/renderProfileSectionContent";
import { PersonalizationSectionPanel } from "packages/features/profile/components/layout";
import type { PatchBuyerPreferenceExtensions } from "packages/features/profile/components/profileScreen/searchPreferences/types";
import type { OnboardingData } from "packages/features/profile/utils";

export type ProfileSectionPanelProps = {
  currentStep: { id: string; title: string } | undefined;
  activeSection: string;
  showAvailabilityEditor: boolean;
  effectiveEditMode: boolean;
  formData: OnboardingData;
  agentSubject?: { userId: string; displayName: string } | null;
  userProfile: { name?: string | null; profile_picture_url?: string | null } | null | undefined;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
  onChangeProfilePhoto: () => void;
  isUploadingProfilePicture: boolean;
  profilePictureError: Error | null;
};

export function ProfileSectionPanel({
  currentStep,
  activeSection,
  showAvailabilityEditor,
  effectiveEditMode,
  formData,
  agentSubject = null,
  userProfile,
  updateField,
  patchBuyerPreferenceExtensions,
  onChangeProfilePhoto,
  isUploadingProfilePicture,
  profilePictureError,
}: ProfileSectionPanelProps) {
  if (!currentStep || activeSection !== currentStep.id) {
    return null;
  }

  const photoProps =
    agentSubject == null
      ? {
          profilePictureUrl: userProfile?.profile_picture_url,
          onUploadPhoto: onChangeProfilePhoto,
          isUploadingProfilePicture,
          profilePictureError:
            profilePictureError != null ? { message: profilePictureError.message } : null,
          userDisplayName: userProfile?.name,
        }
      : undefined;

  return (
    <PersonalizationSectionPanel
      sectionId={currentStep.id}
      screenReaderHeading={currentStep.title}
      showVisibleHeading={activeSection !== "location"}
    >
      {renderProfileSectionContent({
        sectionId: activeSection,
        surface: "profileScreen",
        formData,
        isEditMode: effectiveEditMode,
        updateField,
        patchBuyerPreferenceExtensions,
        showAvailabilityEditor,
        agentSubject,
        photoProps,
      })}
    </PersonalizationSectionPanel>
  );
}
