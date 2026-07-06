import React from "react";

import { type OnboardingData } from "packages/features/profile/utils";
import { TagInput as OnPerTagInput } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
type HousingTagRowsProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

export function HousingTagRows({ formData, isEditMode, updateFormData }: HousingTagRowsProps) {
  return (
    <Box>
      <OnPerTagInput
        value={(formData.other_requirements as string[]) ?? []}
        onChange={(value: string[]) => updateFormData("other_requirements", value)}
        placeholder="e.g., street parking, no gated communities"
        isEditMode={isEditMode}
      />
    </Box>
  );
}
