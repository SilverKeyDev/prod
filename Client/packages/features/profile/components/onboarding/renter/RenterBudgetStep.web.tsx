/**
 * RenterBudgetStep — SIL-226
 * Captures monthly rent budget range for renter onboarding.
 * Rental-specific copy — no purchase language.
 */
import React from "react";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { RENTER_TRANSLATIONS } from "packages/features/renter/types/translations";
import { Input, Label } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type Props = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

export function RenterBudgetStep({ formData, updateFormData }: Props) {
  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {RENTER_TRANSLATIONS.RENTER_BUDGET_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {RENTER_TRANSLATIONS.RENTER_BUDGET_SUBTITLE}
        </BodyText>
      </Box>
      <Box className="grid gap-4 sm:grid-cols-2">
        <Box className="flex flex-col gap-1">
          <Label className="text-sm font-medium text-gray-700">
            {RENTER_TRANSLATIONS.RENTER_BUDGET_MIN_LABEL}
          </Label>
          <Input
            type="number"
            min={0}
            step={100}
            value={formData.renter_budget_min ?? ""}
            onChange={(e) =>
              updateFormData(
                "renter_budget_min",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            placeholder="e.g. 1500"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </Box>
        <Box className="flex flex-col gap-1">
          <Label className="text-sm font-medium text-gray-700">
            {RENTER_TRANSLATIONS.RENTER_BUDGET_MAX_LABEL}
          </Label>
          <Input
            type="number"
            min={0}
            step={100}
            value={formData.renter_budget_max ?? ""}
            onChange={(e) =>
              updateFormData(
                "renter_budget_max",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            placeholder="e.g. 2500"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </Box>
      </Box>
    </Box>
  );
}
