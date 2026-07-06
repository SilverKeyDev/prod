/**
 * RenterAmenitiesStep — SIL-226
 * Captures amenity preferences for renter onboarding.
 */
import React from "react";
import { RENTER_TRANSLATIONS } from "packages/features/renter/types/translations";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import { Box } from "packages/ui/components/structure/primitives";

type Props = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

const AMENITY_OPTIONS = [
  { value: "in_unit_laundry", label: "In-unit laundry" },
  { value: "parking", label: "Parking" },
  { value: "gym", label: "Gym / fitness center" },
  { value: "pet_friendly", label: "Pet friendly" },
  { value: "pool", label: "Pool" },
  { value: "doorman", label: "Doorman / concierge" },
  { value: "rooftop", label: "Rooftop access" },
  { value: "storage", label: "Storage unit" },
  { value: "ac", label: "Central A/C" },
  { value: "utilities_included", label: "Utilities included" },
  { value: "furnished", label: "Furnished" },
  { value: "ev_charging", label: "EV charging" },
];

export function RenterAmenitiesStep({ formData, updateFormData }: Props) {
  const selected = formData.renter_amenities ?? [];

  const toggle = (value: string) => {
    updateFormData(
      "renter_amenities",
      selected.includes(value) ? selected.filter((a) => a !== value) : [...selected, value]
    );
  };

  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {RENTER_TRANSLATIONS.RENTER_AMENITIES_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {RENTER_TRANSLATIONS.RENTER_AMENITIES_SUBTITLE}
        </BodyText>
      </Box>
      <Box className="flex flex-wrap gap-2">
        {AMENITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              selected.includes(opt.value)
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </Box>
    </Box>
  );
}
