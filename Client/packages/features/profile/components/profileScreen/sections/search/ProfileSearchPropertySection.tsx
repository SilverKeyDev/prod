import React, { useCallback } from "react";

import {
  ProfileSectionBody,
  ProfileSectionGroup,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import { SearchPrefsCondition } from "packages/features/profile/components/profileScreen/searchPreferences/SearchPrefsCondition";
import { SearchPrefsPhysical } from "packages/features/profile/components/profileScreen/searchPreferences/SearchPrefsPhysical";
import { SearchPrefsUtilities } from "packages/features/profile/components/profileScreen/searchPreferences/SearchPrefsUtilities";
import type { PatchBuyerPreferenceExtensions } from "packages/features/profile/components/profileScreen/searchPreferences/types";
import { withBuyerExtV1 } from "packages/features/profile/components/profileScreen/searchPreferences/withBuyerExtV1";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import { type OnboardingData, SECTION_TITLES } from "packages/features/profile/utils";
import { Box } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";

import { HousingDropdownRows } from "@/features/profile/components/sections/housing/HousingDropdownRows";
import { HousingTagRows } from "@/features/profile/components/sections/housing/HousingTagRows";

export type ProfileSearchPropertySectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
};

export function ProfileSearchPropertySection({
  formData,
  isEditMode,
  updateField,
  patchBuyerPreferenceExtensions,
}: ProfileSearchPropertySectionProps) {
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();
  const patch = useCallback(
    (fn: (prev: BuyerPreferenceExtensions | undefined) => BuyerPreferenceExtensions) => {
      patchBuyerPreferenceExtensions(fn);
    },
    [patchBuyerPreferenceExtensions]
  );

  const ext = withBuyerExtV1(formData.buyerPreferenceExtensions);

  return (
    <ProfileSectionBody>
      {showSectionTitle && <Title size="md">{SECTION_TITLES.SEARCH_PROPERTY_STEP}</Title>}

      <ProfileSectionGroup>
        <Box className="gap-4">
          <Title size="sm" as="h3" className="mb-3 text-base">
            {SECTION_TITLES.HOUSING_STYLE_AND_USE}
          </Title>
          <HousingDropdownRows
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={(field, value) => updateField(field as keyof OnboardingData, value)}
          />
        </Box>
      </ProfileSectionGroup>

      <ProfileSectionGroup withDivider>
        <SearchPrefsPhysical isEditMode={isEditMode} patch={patch} phys={ext.physical ?? {}} />
      </ProfileSectionGroup>

      <ProfileSectionGroup withDivider>
        <SearchPrefsCondition
          isEditMode={isEditMode}
          patch={patch}
          listingStatus={formData.listing_status}
          updateField={updateField}
          cond={ext.condition ?? {}}
        />
      </ProfileSectionGroup>

      <ProfileSectionGroup withDivider>
        <SearchPrefsUtilities isEditMode={isEditMode} patch={patch} util={ext.utilities ?? {}} />
      </ProfileSectionGroup>

      <ProfileSectionGroup title={SECTION_TITLES.HOUSING_OTHER_REQUIREMENTS} withDivider>
        <HousingTagRows
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={(field, value) => updateField(field as keyof OnboardingData, value)}
        />
      </ProfileSectionGroup>
    </ProfileSectionBody>
  );
}
