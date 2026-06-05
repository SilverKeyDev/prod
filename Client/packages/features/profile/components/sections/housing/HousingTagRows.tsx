import React from "react";

import { Box } from "packages/ui/components/structure/primitives";

import OnPerTagInput from "@/features/profile/components/settings/inputs/tags/TagInput.web";
import { type OnboardingData } from "@/features/profile/utils";
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
