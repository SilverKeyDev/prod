import React from "react";

import {
  ProfileSectionBody,
  ProfileSectionGroup,
} from "packages/features/profile/components/layout";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/buyerPreferenceExtensions";
import { useResponsive } from "packages/hooks/ui";
import { Box } from "packages/ui/components/primitives";

import { SearchPrefsPhysical } from "@/features/profile/components/profileScreen/searchPreferences/SearchPrefsPhysical";
import { withBuyerExtV1 } from "@/features/profile/components/profileScreen/searchPreferences/withBuyerExtV1";
import { type OnboardingData, SECTION_TITLES } from "@/features/profile/utils";

import { HousingDropdownRows } from "./HousingDropdownRows";
import { HousingEssentialRows } from "./HousingEssentialRows";
import { HousingRangeRows } from "./HousingRangeRows";
import { HousingTagRows } from "./HousingTagRows";

type HousingPreferencesBodyProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  patchBuyerPreferenceExtensions?: (
    fn: (
      prev: BuyerPreferenceExtensions | undefined,
    ) => BuyerPreferenceExtensions,
  ) => void;
};

export function HousingPreferencesBody({
  formData,
  isEditMode,
  updateFormData,
  patchBuyerPreferenceExtensions,
}: HousingPreferencesBodyProps) {
  const { isDesktop } = useResponsive();
  const ext = withBuyerExtV1(formData.buyerPreferenceExtensions);

  return (
    <ProfileSectionBody>
      <ProfileSectionGroup title={SECTION_TITLES.HOUSING_ESSENTIALS}>
        <HousingEssentialRows
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={updateFormData}
        />
      </ProfileSectionGroup>

      <ProfileSectionGroup title={SECTION_TITLES.HOUSING_RANGES} withDivider>
        <HousingRangeRows
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={updateFormData}
        />
      </ProfileSectionGroup>

      {patchBuyerPreferenceExtensions && (
        <ProfileSectionGroup withDivider>
          <SearchPrefsPhysical
            isEditMode={isEditMode}
            patch={patchBuyerPreferenceExtensions}
            phys={ext.physical ?? {}}
          />
        </ProfileSectionGroup>
      )}

      <ProfileSectionGroup
        title={SECTION_TITLES.HOUSING_OTHER_REQUIREMENTS}
        withDivider
      >
        <HousingTagRows
          formData={formData}
          isEditMode={isEditMode}
          updateFormData={updateFormData}
        />
      </ProfileSectionGroup>

      <ProfileSectionGroup
        title={SECTION_TITLES.HOUSING_STYLE_AND_USE}
        withDivider
      >
        <Box className="gap-4">
          <HousingDropdownRows
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={updateFormData}
            isDesktop={isDesktop}
          />
        </Box>
      </ProfileSectionGroup>
    </ProfileSectionBody>
  );
}
