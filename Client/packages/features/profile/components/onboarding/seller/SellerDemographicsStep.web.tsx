/**
 * SellerDemographicsStep — SIL-192
 * Captures basic contact/demographic info for the seller.
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

export function SellerDemographicsStep({ formData, updateFormData }: Props) {
  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {SELLER_TRANSLATIONS.SELLER_DEMOGRAPHICS_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {SELLER_TRANSLATIONS.SELLER_DEMOGRAPHICS_SUBTITLE}
        </BodyText>
      </Box>
      <Box className="flex flex-col gap-4">
        <Box className="grid gap-4 sm:grid-cols-2">
          <Box className="flex flex-col gap-1">
            <Label className="text-sm font-medium text-gray-700">
              {SELLER_TRANSLATIONS.SELLER_DEMOGRAPHICS_FIRST_NAME_LABEL}
            </Label>
            <Input
              type="text"
              value={formData.first_name ?? ""}
              onValueChange={(text) => updateFormData("first_name", text)}
              placeholder="e.g. Jane"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </Box>
          <Box className="flex flex-col gap-1">
            <Label className="text-sm font-medium text-gray-700">
              {SELLER_TRANSLATIONS.SELLER_DEMOGRAPHICS_LAST_NAME_LABEL}
            </Label>
            <Input
              type="text"
              value={formData.last_name ?? ""}
              onValueChange={(text) => updateFormData("last_name", text)}
              placeholder="e.g. Smith"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </Box>
        </Box>
        <Box className="flex flex-col gap-1">
          <Label className="text-sm font-medium text-gray-700">
            {SELLER_TRANSLATIONS.SELLER_DEMOGRAPHICS_PHONE_LABEL}
          </Label>
          <Input
            type="tel"
            value={formData.phone ?? ""}
            onValueChange={(text) => updateFormData("phone", text)}
            placeholder="e.g. (404) 555-0123"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </Box>
      </Box>
    </Box>
  );
}
