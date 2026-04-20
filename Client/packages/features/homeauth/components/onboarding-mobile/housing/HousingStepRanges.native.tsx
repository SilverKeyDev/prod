import React from "react";

import Input from "@ui/form/Input";

import { LotSizeAndHomeAgeSliders } from "packages/features/profile";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

import { FIELD_LABELS, type OnboardingData, SECTION_TITLES } from "@/features/profile/utils";

type Props = {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

export function HousingStepRanges({ formData, updateFormData }: Props) {
  return (
    <Box className="gap-6">
      <Text className="text-text-primary text-lg font-semibold">
        {SECTION_TITLES.HOUSING_RANGES}
      </Text>

      <Box>
        <Text className="text-text-secondary mb-2 text-sm font-medium">
          {FIELD_LABELS.SQUARE_FEET}
        </Text>
        <Text className="text-text-secondary mb-3 text-xs">
          Roughly how big do you want your home to be?
        </Text>
        <Box className="flex flex-row gap-3">
          <Box className="flex-1">
            <Text className="text-text-secondary mb-1 text-xs font-medium">Min</Text>
            <Input
              value={formData.preferred_sqft_min?.toString() ?? ""}
              onValueChange={(v) =>
                updateFormData("preferred_sqft_min", v ? parseInt(v, 10) : undefined)
              }
              placeholder="e.g. 1200"
              keyboardType="number-pad"
              className="border-border bg-background-surface text-text-primary rounded-lg border px-4 py-3 text-base"
            />
          </Box>
          <Box className="flex-1">
            <Text className="text-text-secondary mb-1 text-xs font-medium">Max</Text>
            <Input
              value={formData.preferred_sqft_max?.toString() ?? ""}
              onValueChange={(v) =>
                updateFormData("preferred_sqft_max", v ? parseInt(v, 10) : undefined)
              }
              placeholder="e.g. 2500"
              keyboardType="number-pad"
              className="border-border bg-background-surface text-text-primary rounded-lg border px-4 py-3 text-base"
            />
          </Box>
        </Box>
      </Box>

      <Box className="gap-4">
        <Text className="text-text-secondary text-xs">
          Lot size and home age use the same ranges as search and profile. Adjust the sliders below.
        </Text>
        <LotSizeAndHomeAgeSliders formData={formData} updateFormData={updateFormData} />
      </Box>

      <Box>
        <Text className="text-text-secondary mb-2 text-sm font-medium">
          {FIELD_LABELS.DAYS_ON_MARKET}
        </Text>
        <Box className="flex flex-row gap-3">
          <Box className="flex-1">
            <Text className="text-text-secondary mb-1 text-xs font-medium">Min (days)</Text>
            <Input
              value={formData.days_on_market_min?.toString() ?? ""}
              onValueChange={(v) =>
                updateFormData(
                  "days_on_market_min",
                  v && v.trim() !== "" ? Number.parseInt(v, 10) || undefined : undefined
                )
              }
              placeholder="e.g. 7"
              keyboardType="number-pad"
              className="border-border bg-background-surface text-text-primary rounded-lg border px-4 py-3 text-base"
            />
          </Box>
          <Box className="flex-1">
            <Text className="text-text-secondary mb-1 text-xs font-medium">Max (days)</Text>
            <Input
              value={formData.days_on_market_max?.toString() ?? ""}
              onValueChange={(v) =>
                updateFormData(
                  "days_on_market_max",
                  v && v.trim() !== "" ? Number.parseInt(v, 10) || undefined : undefined
                )
              }
              placeholder="e.g. 90"
              keyboardType="number-pad"
              className="border-border bg-background-surface text-text-primary rounded-lg border px-4 py-3 text-base"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
