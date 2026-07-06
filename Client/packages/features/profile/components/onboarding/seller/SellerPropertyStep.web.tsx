/**
 * SellerPropertyStep — SIL-192
 * Captures the type of property the seller wants to sell.
 */
import React from "react";

import { SELLER_TRANSLATIONS } from "packages/features/seller/types/translations";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import { Box } from "packages/ui/components/structure/primitives";

type Props = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

const PROPERTY_TYPES = [
  { value: "single_family", label: "Single-family home" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi_family", label: "Multi-family" },
  { value: "land", label: "Land / lot" },
  { value: "other", label: "Other" },
] as const;

export function SellerPropertyStep({ formData, updateFormData }: Props) {
  const selected = formData.seller_property_type ?? "";

  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {SELLER_TRANSLATIONS.SELLER_PROPERTY_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {SELLER_TRANSLATIONS.SELLER_PROPERTY_SUBTITLE}
        </BodyText>
      </Box>
      <Box className="grid gap-3 sm:grid-cols-2">
        {PROPERTY_TYPES.map((pt) => (
          <button
            key={pt.value}
            type="button"
            onClick={() => updateFormData("seller_property_type", pt.value)}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
              selected === pt.value
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            {pt.label}
          </button>
        ))}
      </Box>
    </Box>
  );
}