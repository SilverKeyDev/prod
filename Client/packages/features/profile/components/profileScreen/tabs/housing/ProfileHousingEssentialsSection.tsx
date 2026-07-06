import React from "react";

import { HousingEssentialRows } from "packages/features/profile/components/formSections/housing/HousingEssentialRows";
import {
  ProfileSectionBody,
  ProfileSectionCallout,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import { useAgentOptionalBuyerCalloutVisibility } from "packages/features/profile/hooks/useAgentOptionalBuyerCalloutVisibility";
import {
  AGENT_OPTIONAL_BUYER_SEARCH_PREFERENCES_HINT,
  type OnboardingData,
  SECTION_TITLES,
} from "packages/features/profile/utils";
import Title from "packages/ui/components/structure/text/Title";

export type ProfileHousingEssentialsSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
};

export function ProfileHousingEssentialsSection({
  formData,
  isEditMode,
  updateField,
}: ProfileHousingEssentialsSectionProps) {
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();
  const showAgentOptionalBuyerCallout = useAgentOptionalBuyerCalloutVisibility(formData);

  return (
    <ProfileSectionBody>
      {showSectionTitle && <Title size="md">{SECTION_TITLES.HOUSING_ESSENTIALS}</Title>}
      {showAgentOptionalBuyerCallout && (
        <ProfileSectionCallout>
          {AGENT_OPTIONAL_BUYER_SEARCH_PREFERENCES_HINT}
        </ProfileSectionCallout>
      )}

      <HousingEssentialRows
        formData={formData}
        isEditMode={isEditMode}
        updateFormData={(field, value) => updateField(field as keyof OnboardingData, value)}
      />
    </ProfileSectionBody>
  );
}
