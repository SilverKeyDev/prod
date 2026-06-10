import React from "react";

import { HousingRangeRows } from "packages/features/profile/components/formSections/housing/HousingRangeRows";
import {
  ProfileSectionBody,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import { type OnboardingData, SECTION_TITLES } from "packages/features/profile/utils";
import Title from "packages/ui/components/structure/text/Title";

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
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();

  return (
    <ProfileSectionBody>
      {showSectionTitle && <Title size="md">{SECTION_TITLES.HOUSING_RANGES}</Title>}
      <HousingRangeRows
        formData={formData}
        isEditMode={isEditMode}
        updateFormData={(field, value) => updateField(field as keyof OnboardingData, value)}
      />
    </ProfileSectionBody>
  );
}
