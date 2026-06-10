import React from "react";

import type { BuyerPhysicalPrefs } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import { SECTION_TITLES } from "packages/features/profile/utils";
import { Box } from "packages/ui/components/structure/primitives";
import Title from "packages/ui/components/structure/text/Title";

import { SearchPrefsAmenityRows } from "./physical/SearchPrefsAmenityRows";
import { SearchPrefsGarageRows } from "./physical/SearchPrefsGarageRows";
import { SearchPrefsStoriesParkingRows } from "./physical/SearchPrefsStoriesParkingRows";
import type { PatchBuyerPreferenceExtensions } from "./types";

type SearchPrefsPhysicalProps = {
  isEditMode: boolean;
  patch: PatchBuyerPreferenceExtensions;
  phys: BuyerPhysicalPrefs;
};

export function SearchPrefsPhysical({ isEditMode, patch, phys }: SearchPrefsPhysicalProps) {
  return (
    <Box className="gap-4">
      <Title size="sm" as="h3" className="mb-3 text-base">
        {SECTION_TITLES.SEARCH_PREFS_PHYSICAL}
      </Title>
      <Box className="flex flex-col gap-6">
        <SearchPrefsGarageRows isEditMode={isEditMode} patch={patch} phys={phys} />
        <SearchPrefsStoriesParkingRows isEditMode={isEditMode} patch={patch} phys={phys} />
        <SearchPrefsAmenityRows isEditMode={isEditMode} patch={patch} phys={phys} />
      </Box>
    </Box>
  );
}
