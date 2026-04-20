import React from "react";

import {
  ProfileSectionBody,
  ProfileSectionCallout,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import {
  AGENT_OPTIONAL_BUYER_SEARCH_PREFERENCES_HINT,
  effectiveIsAgentForOptionalBuyerUi,
  type OnboardingData,
  SECTION_TITLES,
} from "packages/features/profile/utils";
import { useIsAgent } from "packages/hooks/store/useIsAgent";
import Title from "packages/ui/components/text/Title";

import { HousingEssentialRows } from "@/features/profile/components/sections/housing/HousingEssentialRows";

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
  const authIsAgent = useIsAgent();
  const showAgentOptionalBuyerCallout = effectiveIsAgentForOptionalBuyerUi({
    authIsAgent,
    formIsAgent: formData.is_agent,
  });

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
