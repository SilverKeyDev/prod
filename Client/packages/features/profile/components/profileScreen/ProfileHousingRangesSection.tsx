import React from "react";

import {
  ProfileSectionBody,
  useHidePersonalizationStepHeading,
} from "packages/features/profile/components/layout";
import {
  type OnboardingData,
  SECTION_TITLES,
} from "packages/features/profile/utils";
import Title from "packages/ui/components/text/Title";

import { HousingRangeRows } from "@/features/profile/components/sections/housing/HousingRangeRows";

export type ProfileHousingRangesSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
};

export function ProfileHousingRangesSection({
  formData,
  isEditMode,
  updateField,
}: ProfileHousingRangesSectionProps) {
  const hideStepHeading = useHidePersonalizationStepHeading();

  return (
    <ProfileSectionBody>
      {!hideStepHeading && (
        <Title size="md">{SECTION_TITLES.HOUSING_RANGES}</Title>
      )}
      <HousingRangeRows
        formData={formData}
        isEditMode={isEditMode}
        updateFormData={(field, value) =>
          updateField(field as keyof OnboardingData, value)
        }
      />
    </ProfileSectionBody>
  );
}
