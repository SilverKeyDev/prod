import React from "react";

import { Box } from "packages/ui/components/primitives";

import Label from "@/features/profile/components/settings/inputs/Label";
import OnPerTagInput from "@/features/profile/components/settings/inputs/TagInput.web";
import { FIELD_LABELS, type OnboardingData } from "@/features/profile/utils";
type HousingTagRowsProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

export function HousingTagRows({ formData, isEditMode, updateFormData }: HousingTagRowsProps) {
  return (
    <Box>
      <Label>{FIELD_LABELS.OTHER_REQUIREMENTS}</Label>
      <OnPerTagInput
        value={(formData.other_requirements as string[]) ?? []}
        onChange={(value: string[]) => updateFormData("other_requirements", value)}
        placeholder="e.g., street parking, no gated communities"
        isEditMode={isEditMode}
      />
    </Box>
  );
}
