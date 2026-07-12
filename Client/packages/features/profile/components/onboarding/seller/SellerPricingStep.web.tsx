/**
 * SellerPricingStep — SIL-192
 * Captures the seller's pricing expectations.
 */
import React from "react";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { SELLER_TRANSLATIONS } from "packages/features/seller/types/translations";
import { Input, Label } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type Props = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

export function SellerPricingStep({ formData, updateFormData }: Props) {
  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {SELLER_TRANSLATIONS.SELLER_PRICING_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {SELLER_TRANSLATIONS.SELLER_PRICING_SUBTITLE}
        </BodyText>
      </Box>
      <Box className="grid gap-4 sm:grid-cols-2">
        <Box className="flex flex-col gap-1">
          <Label className="text-sm font-medium text-gray-700">
            {SELLER_TRANSLATIONS.SELLER_PRICING_TARGET_LABEL}
          </Label>
          <Input
            type="number"
            min={0}
            step={10000}
            value={formData.seller_price_target ?? ""}
            onChange={(e) =>
              updateFormData(
                "seller_price_target",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            placeholder="e.g. 450000"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </Box>
        <Box className="flex flex-col gap-1">
          <Label className="text-sm font-medium text-gray-700">
            {SELLER_TRANSLATIONS.SELLER_PRICING_MIN_LABEL}
          </Label>
          <Input
            type="number"
            min={0}
            step={10000}
            value={formData.seller_price_min ?? ""}
            onChange={(e) =>
              updateFormData(
                "seller_price_min",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            placeholder="e.g. 400000"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </Box>
      </Box>
    </Box>
  );
}
