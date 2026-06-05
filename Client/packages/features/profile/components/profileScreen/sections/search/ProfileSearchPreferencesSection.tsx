import React, { useCallback } from "react";

import {
  ProfileSectionBody,
  ProfileSectionGroup,
} from "packages/features/profile/components/layout";
import { SearchPrefsCondition } from "packages/features/profile/components/profileScreen/searchPreferences/SearchPrefsCondition";
import { SearchPrefsPhysical } from "packages/features/profile/components/profileScreen/searchPreferences/SearchPrefsPhysical";
import { SearchPrefsUtilities } from "packages/features/profile/components/profileScreen/searchPreferences/SearchPrefsUtilities";
import type { PatchBuyerPreferenceExtensions } from "packages/features/profile/components/profileScreen/searchPreferences/types";
import { withBuyerExtV1 } from "packages/features/profile/components/profileScreen/searchPreferences/withBuyerExtV1";
import { ProfileFinancialSection } from "packages/features/profile/components/profileScreen/sections/financial/ProfileFinancialSection";
import { ProfileLocationSection } from "packages/features/profile/components/profileScreen/sections/location/ProfileLocationSection";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import { type OnboardingData, SECTION_TITLES } from "packages/features/profile/utils";
import { Box } from "packages/ui/components/structure/primitives";
import Title from "packages/ui/components/structure/text/Title";

import { HousingEssentialRows } from "@/features/profile/components/sections/housing/HousingEssentialRows";
import { HousingRangeRows } from "@/features/profile/components/sections/housing/HousingRangeRows";

export type { PatchBuyerPreferenceExtensions } from "packages/features/profile/components/profileScreen/searchPreferences/types";

type ProfileSearchPreferencesSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
};

/**
 * Single-page stack of merged buyer preference blocks (essentials, size, features, location, finance).
 */
export function ProfileSearchPreferencesSection({
  formData,
  isEditMode,
  updateField,
  patchBuyerPreferenceExtensions,
}: ProfileSearchPreferencesSectionProps) {
  const patch = useCallback(
    (fn: (prev: BuyerPreferenceExtensions | undefined) => BuyerPreferenceExtensions) => {
      patchBuyerPreferenceExtensions(fn);
    },
    [patchBuyerPreferenceExtensions]
  );

  const ext = withBuyerExtV1(formData.buyerPreferenceExtensions);

  return (
    <Box className="space-y-8">
      <Box>
        <Title size="md">{SECTION_TITLES.SEARCH_PREFERENCES}</Title>
      </Box>

      <ProfileSectionBody>
        <ProfileSectionGroup title={SECTION_TITLES.HOUSING_ESSENTIALS}>
          <HousingEssentialRows
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={(field, value) => updateField(field as keyof OnboardingData, value)}
          />
        </ProfileSectionGroup>

        <ProfileSectionGroup title={SECTION_TITLES.HOUSING_RANGES} withDivider>
          <HousingRangeRows
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={(field, value) => updateField(field as keyof OnboardingData, value)}
          />
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
      </ProfileSectionBody>

      <ProfileLocationSection
        formData={formData}
        isEditMode={isEditMode}
        updateField={updateField}
        patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
      />

      <ProfileFinancialSection
        formData={formData}
        isEditMode={isEditMode}
        updateField={updateField}
        patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
      />
    </Box>
  );
}
