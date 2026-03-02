import React from "react";

import { Box } from "packages/ui/components/primitives/box";
import { Input } from "packages/ui/components/primitives/input";
import { Text } from "packages/ui/components/primitives/text";

import { FIELD_LABELS, type OnboardingData, SECTION_TITLES } from "@/features/profile/utils";

type HousingStepProps = {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

export function HousingStep({ formData, updateFormData }: HousingStepProps) {
  return (
    <Box className="gap-5">
      <Text className="text-lg font-semibold text-gray-900">
        {SECTION_TITLES.HOUSING_PREFERENCES}
      </Text>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.PREFERRED_BEDROOMS}
        </Text>
        <Input
          value={formData.preferred_bedrooms?.toString() ?? ""}
          onValueChange={(v) =>
            updateFormData("preferred_bedrooms", v ? parseInt(v, 10) : undefined)
          }
          placeholder="e.g. 3"
          keyboardType="number-pad"
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
        />
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.PREFERRED_BATHROOMS}
        </Text>
        <Input
          value={formData.preferred_bathrooms?.toString() ?? ""}
          onValueChange={(v) =>
            updateFormData("preferred_bathrooms", v ? parseInt(v, 10) : undefined)
          }
          placeholder="e.g. 2"
          keyboardType="number-pad"
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
        />
      </Box>
    </Box>
  );
}
