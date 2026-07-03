/**
 * SellerAddressStep — SIL-192
 * Captures the address of the property the seller wants to list.
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
          <label className="text-sm font-medium text-gray-700">
            {SELLER_TRANSLATIONS.SELLER_ADDRESS_STREET_LABEL}
          </label>
          <input
            type="text"
            value={formData.seller_address_street ?? ""}
            onChange={(e) => updateFormData("seller_address_street", e.target.value)}
            placeholder="e.g. 123 Main St"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </Box>
        <Box className="grid gap-4 sm:grid-cols-3">
          <Box className="flex flex-col gap-1 sm:col-span-1">
            <label className="text-sm font-medium text-gray-700">
              {SELLER_TRANSLATIONS.SELLER_ADDRESS_CITY_LABEL}
            </label>
            <input
              type="text"
              value={formData.seller_address_city ?? ""}
              onChange={(e) => updateFormData("seller_address_city", e.target.value)}
              placeholder="e.g. Atlanta"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </Box>
          <Box className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              {SELLER_TRANSLATIONS.SELLER_ADDRESS_STATE_LABEL}
            </label>
            <input
              type="text"
              value={formData.seller_address_state ?? ""}
              onChange={(e) => updateFormData("seller_address_state", e.target.value)}
              placeholder="e.g. GA"
              maxLength={2}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </Box>
          <Box className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              {SELLER_TRANSLATIONS.SELLER_ADDRESS_ZIP_LABEL}
            </label>
            <input
              type="text"
              value={formData.seller_address_zip ?? ""}
              onChange={(e) => updateFormData("seller_address_zip", e.target.value)}
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