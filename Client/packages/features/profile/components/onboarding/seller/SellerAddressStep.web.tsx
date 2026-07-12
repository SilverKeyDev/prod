/**
 * SellerAddressStep — SIL-192
 * Captures the address of the property the seller wants to list.
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

export function SellerAddressStep({ formData, updateFormData }: Props) {
  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {SELLER_TRANSLATIONS.SELLER_ADDRESS_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {SELLER_TRANSLATIONS.SELLER_ADDRESS_SUBTITLE}
        </BodyText>
      </Box>
      <Box className="flex flex-col gap-4">
        <Box className="flex flex-col gap-1">
          <Label className="text-sm font-medium text-gray-700">
            {SELLER_TRANSLATIONS.SELLER_ADDRESS_STREET_LABEL}
          </Label>
          <Input
            type="text"
            value={formData.seller_address_street ?? ""}
            onValueChange={(text) => updateFormData("seller_address_street", text)}
            placeholder="e.g. 123 Main St"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </Box>
        <Box className="grid gap-4 sm:grid-cols-3">
          <Box className="flex flex-col gap-1 sm:col-span-1">
            <Label className="text-sm font-medium text-gray-700">
              {SELLER_TRANSLATIONS.SELLER_ADDRESS_CITY_LABEL}
            </Label>
            <Input
              type="text"
              value={formData.seller_address_city ?? ""}
              onValueChange={(text) => updateFormData("seller_address_city", text)}
              placeholder="e.g. Atlanta"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </Box>
          <Box className="flex flex-col gap-1">
            <Label className="text-sm font-medium text-gray-700">
              {SELLER_TRANSLATIONS.SELLER_ADDRESS_STATE_LABEL}
            </Label>
            <Input
              type="text"
              value={formData.seller_address_state ?? ""}
              onValueChange={(text) => updateFormData("seller_address_state", text)}
              placeholder="e.g. GA"
              maxLength={2}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </Box>
          <Box className="flex flex-col gap-1">
            <Label className="text-sm font-medium text-gray-700">
              {SELLER_TRANSLATIONS.SELLER_ADDRESS_ZIP_LABEL}
            </Label>
            <Input
              type="text"
              value={formData.seller_address_zip ?? ""}
              onValueChange={(text) => updateFormData("seller_address_zip", text)}
              placeholder="e.g. 30301"
              maxLength={5}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
