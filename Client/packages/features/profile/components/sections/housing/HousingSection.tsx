import React from "react";

import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { Title } from "@/components/ui";
import { type OnboardingData, SECTION_TITLES } from "@/features/profile/utils";

import { HousingBasicRows } from "./HousingBasicRows";
import { HousingDropdownRows } from "./HousingDropdownRows";
import { HousingRangeRows } from "./HousingRangeRows";
import { HousingTagRows } from "./HousingTagRows";
type HousingSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  isDesktop: boolean;
  wrapInCard?: boolean;
};

export default function HousingSection({
  formData,
  isEditMode,
  updateFormData,
  isDesktop,
  wrapInCard = true,
}: HousingSectionProps) {
  const content = (
    <>
      <Title size="md" className="mb-2">
        {SECTION_TITLES.HOUSING_PREFERENCES}
      </Title>

      <HousingBasicRows
        formData={formData}
        isEditMode={isEditMode}
        updateFormData={updateFormData}
      />

      <HousingRangeRows
        formData={formData}
        isEditMode={isEditMode}
        updateFormData={updateFormData}
      />

      <HousingTagRows formData={formData} isEditMode={isEditMode} updateFormData={updateFormData} />

      <HousingDropdownRows
        formData={formData}
        isEditMode={isEditMode}
        updateFormData={updateFormData}
        isDesktop={isDesktop}
      />
    </>
  );

  return wrapInCard ? (
    <Card border="charcoal" className="space-y-6">{content}</Card>
  ) : (
    <Box className="space-y-6">{content}</Box>
  );
}
