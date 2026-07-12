/**
 * RenterHouseholdStep — SIL-226
 * Captures household size and pet information for renter onboarding.
 */
import React from "react";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { RENTER_TRANSLATIONS } from "packages/features/renter/types/translations";
import { Button, Input, Label } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type Props = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

const PET_TYPES = ["Dog", "Cat", "Bird", "Fish", "Other"];

export function RenterHouseholdStep({ formData, updateFormData }: Props) {
  const hasPets = formData.renter_has_pets ?? false;

  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {RENTER_TRANSLATIONS.RENTER_HOUSEHOLD_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {RENTER_TRANSLATIONS.RENTER_HOUSEHOLD_SUBTITLE}
        </BodyText>
      </Box>

      {/* Household size */}
      <Box className="flex flex-col gap-1">
        <Label className="text-sm font-medium text-gray-700">
          {RENTER_TRANSLATIONS.RENTER_HOUSEHOLD_SIZE_LABEL}
        </Label>
        <Input
          type="number"
          min={1}
          max={20}
          value={formData.renter_household_size ?? ""}
          onChange={(e) =>
            updateFormData(
              "renter_household_size",
              e.target.value ? Number(e.target.value) : undefined
            )
          }
          placeholder="e.g. 2"
          className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </Box>

      {/* Pets toggle */}
      <Box className="flex flex-col gap-3">
        <Label className="text-sm font-medium text-gray-700">
          {RENTER_TRANSLATIONS.RENTER_HOUSEHOLD_PETS_LABEL}
        </Label>
        <Box className="flex gap-3">
          {["Yes", "No"].map((opt) => (
            <Button
              key={opt}
              type="button"
              variant="outline"
              size="sm"
              label={opt}
              onClick={() => updateFormData("renter_has_pets", opt === "Yes")}
              className={`rounded-xl border px-6 py-2 text-sm font-medium transition-colors ${
                hasPets === (opt === "Yes")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Button.Label
                variant="outline"
                size="sm"
                className={hasPets === (opt === "Yes") ? "text-blue-700" : "text-gray-700"}
              >
                {opt}
              </Button.Label>
            </Button>
          ))}
        </Box>

        {/* Pet types — shown only if has pets */}
        {hasPets && (
          <Box className="flex flex-col gap-1">
            <Label className="text-sm font-medium text-gray-700">
              {RENTER_TRANSLATIONS.RENTER_HOUSEHOLD_PET_TYPES_LABEL}
            </Label>
            <Box className="flex flex-wrap gap-2">
              {PET_TYPES.map((pet) => {
                const selected = (formData.renter_pet_types ?? []).includes(pet);
                return (
                  <Button
                    key={pet}
                    type="button"
                    variant="outline"
                    size="sm"
                    label={pet}
                    onClick={() => {
                      const current = formData.renter_pet_types ?? [];
                      updateFormData(
                        "renter_pet_types",
                        selected ? current.filter((p) => p !== pet) : [...current, pet]
                      );
                    }}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Button.Label
                      variant="outline"
                      size="sm"
                      className={selected ? "text-blue-700" : "text-gray-600"}
                    >
                      {pet}
                    </Button.Label>
                  </Button>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
