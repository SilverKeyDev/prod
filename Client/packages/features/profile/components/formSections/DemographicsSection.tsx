import React from "react";

import { useShowPersonalizationSectionBodyTitle } from "packages/features/profile/components/layout";
import type { OnboardingData } from "packages/features/profile/utils";
import { shouldShowBuyerOnboardingUi } from "packages/features/profile/utils/onboarding/role/onboardingRoleSelection";
import { Box } from "packages/ui/components/structure/primitives";
import Title from "packages/ui/components/structure/text/Title";

import { AgentDemographicsFields } from "./demographics/AgentDemographicsFields";
import { BuyerAboutProfileSection } from "./demographics/BuyerAboutProfileSection";

export type DemographicsPhotoProps = {
  profilePictureUrl?: string | null;
  onUploadPhoto?: () => void | Promise<void>;
  isUploadingProfilePicture?: boolean;
  profilePictureError?: { message: string } | null;
  userDisplayName?: string | null;
};

export type DemographicsSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
  hideProfilePictureWhenOnboarding?: boolean;
  hideNameWhenOnboarding?: boolean;
  showWhyJoiningQuestion?: boolean;
  photoProps?: DemographicsPhotoProps;
};

export default function DemographicsSection({
  formData,
  isEditMode,
  updateField,
  hideProfilePictureWhenOnboarding = false,
  hideNameWhenOnboarding = false,
  showWhyJoiningQuestion = true,
  photoProps,
}: DemographicsSectionProps) {
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();

  return (
    <Box className="gap-4">
      {showSectionTitle && <Title size="md">About You</Title>}
      {shouldShowBuyerOnboardingUi(formData) ? (
        <BuyerAboutProfileSection
          formData={formData}
          isEditMode={isEditMode}
          updateField={updateField}
          hideProfilePicture={hideProfilePictureWhenOnboarding}
          hideName={hideNameWhenOnboarding}
          {...photoProps}
        />
      ) : (
        <AgentDemographicsFields
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={(field, value) => updateField(field, value)}
          hideProfilePictureWhenOnboarding={hideProfilePictureWhenOnboarding}
          hideNameWhenOnboarding={hideNameWhenOnboarding}
          showWhyJoiningQuestion={showWhyJoiningQuestion}
          {...photoProps}
        />
      )}
    </Box>
  );
}
