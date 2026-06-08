import React from "react";

import {
  ProfileSectionBody,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import { BuyerFinancingStepContent } from "packages/features/profile/components/onboarding/buyer";
import type { OnboardingData } from "packages/features/profile/utils";
import { SECTION_TITLES, shouldShowBuyerOnboardingUi } from "packages/features/profile/utils";
import Title from "packages/ui/components/structure/text/Title";
import type { HomePriceResult } from "packages/utils/transaction/affordability";

export type FinancialSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
  /** When provided, the affordability estimate block is shown (e.g. in checklist Set budget). */
  homePriceResult?: HomePriceResult | null;
  homePriceLoading?: boolean;
  homePriceError?: string | null;
};

export function FinancialSection({
  formData,
  isEditMode,
  updateField,
  homePriceResult,
  homePriceLoading,
  homePriceError,
}: FinancialSectionProps) {
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();

  if (!shouldShowBuyerOnboardingUi(formData)) {
    return null;
  }

  return (
    <ProfileSectionBody>
      {showSectionTitle && <Title size="md">{SECTION_TITLES.FINANCIAL_PROFILE}</Title>}
      <BuyerFinancingStepContent
        formData={formData}
        updateField={updateField}
        isEditMode={isEditMode}
        showHeader={false}
        homePriceLoading={homePriceLoading}
        homePriceError={homePriceError ?? null}
        homePriceResult={homePriceResult ?? null}
      />
    </ProfileSectionBody>
  );
}
