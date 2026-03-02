import React from "react";

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
    <div className="space-y-6">
      <div>
        <Label>{FIELD_LABELS.PREFERRED_HOME_FEATURES}</Label>
        <OnPerTagInput
          value={(formData.preferred_home_features as string[]) ?? []}
          onChange={(value: string[]) => updateFormData("preferred_home_features", value)}
          placeholder="e.g., garage, pool, fireplace"
          isEditMode={isEditMode}
        />
      </div>

      <div>
        <Label>{FIELD_LABELS.DEAL_BREAKERS}</Label>
        <OnPerTagInput
          value={(formData.deal_breakers as string[]) ?? []}
          onChange={(value: string[]) => updateFormData("deal_breakers", value)}
          placeholder="e.g., No parking, Busy road, Old plumbing"
          isEditMode={isEditMode}
        />
      </div>
    </div>
  );
}
