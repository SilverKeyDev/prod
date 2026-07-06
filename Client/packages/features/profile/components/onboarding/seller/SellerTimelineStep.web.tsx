/**
 * SellerTimelineStep — SIL-192
 * Captures when the seller is looking to sell.
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

const TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1_3_months", label: "1–3 months" },
  { value: "3_6_months", label: "3–6 months" },
  { value: "6_12_months", label: "6–12 months" },
  { value: "over_12_months", label: "More than a year" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

export function SellerTimelineStep({ formData, updateFormData }: Props) {
  const selected = formData.seller_timeline ?? "";

  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {SELLER_TRANSLATIONS.SELLER_TIMELINE_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {SELLER_TRANSLATIONS.SELLER_TIMELINE_SUBTITLE}
        </BodyText>
      </Box>
      <Box className="flex flex-col gap-3">
        {TIMELINE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => updateFormData("seller_timeline", opt.value)}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
              selected === opt.value
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </Box>
    </Box>
  );
}