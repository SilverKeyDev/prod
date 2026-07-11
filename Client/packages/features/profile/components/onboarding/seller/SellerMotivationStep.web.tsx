/**
 * SellerMotivationStep — SIL-192
 * Captures why the seller is selling.
 */
import React from "react";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { SELLER_TRANSLATIONS } from "packages/features/seller/types/translations";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type Props = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

const MOTIVATION_OPTIONS = [
  { value: "upgrading", label: "Upgrading to a larger home" },
  { value: "downsizing", label: "Downsizing" },
  { value: "relocating", label: "Relocating for work or family" },
  { value: "investment", label: "Selling an investment property" },
  { value: "financial", label: "Financial reasons" },
  { value: "divorce_estate", label: "Divorce or estate sale" },
  { value: "other", label: "Other" },
] as const;

export function SellerMotivationStep({ formData, updateFormData }: Props) {
  const selected = formData.seller_motivation ?? "";

  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {SELLER_TRANSLATIONS.SELLER_MOTIVATION_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {SELLER_TRANSLATIONS.SELLER_MOTIVATION_SUBTITLE}
        </BodyText>
      </Box>
      <Box className="grid gap-3 sm:grid-cols-2">
        {MOTIVATION_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant="outline"
            size="sm"
            contentAlign="start"
            label={opt.label}
            onClick={() => updateFormData("seller_motivation", opt.value)}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
              selected === opt.value
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <Button.Label
              variant="outline"
              size="sm"
              className={selected === opt.value ? "text-white" : "text-gray-700"}
            >
              {opt.label}
            </Button.Label>
          </Button>
        ))}
      </Box>
    </Box>
  );
}
