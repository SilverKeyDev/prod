import React from "react";

import {
  ProfileSectionBody,
  ProfileSectionCallout,
} from "packages/features/profile/components/layout";
import { useAgentOptionalBuyerCalloutVisibility } from "packages/features/profile/hooks/useAgentOptionalBuyerCalloutVisibility";
import { OliveCheckbox } from "packages/ui";
import { Box, Pressable } from "packages/ui/components/primitives";
import type { HomePriceResult } from "packages/utils/affordability";

import { BodyText, Dropdown, Input, Label, Title } from "@/components/ui";
import { HomePriceEstimate } from "@/features/homeauth/components/flows/HomePriceEstimate";
import { OnPerLabel } from "@/features/profile/components/settings/inputs/Label";
import BudgetSlider from "@/features/profile/components/settings/inputs/sliders/BudgetSlider";
import PriceRangeSlider from "@/features/profile/components/settings/inputs/sliders/PriceRangeSlider";
import {
  AGENT_OPTIONAL_BUYER_FINANCIAL_HINT,
  CREDIT_SCORE_OPTIONS,
  FIELD_LABELS,
  type OnboardingData,
  REQUIRED_FIELDS_ONBOARDING,
  SECTION_TITLES,
  setPayingCash,
} from "@/features/profile/utils";

type OnboardingFinancialSectionProps = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  /** Affordability display (provided by onboarding when using useOnboardingAffordability) */
  homePriceLoading?: boolean;
  homePriceError?: string | null;
  homePriceResult?: HomePriceResult | null;
  isAffordabilityCollapsed?: boolean;
  setIsAffordabilityCollapsed?: (value: boolean) => void;
};

export default function OnboardingFinancialSection({
  formData,
  updateFormData,
  homePriceLoading,
  homePriceError,
  homePriceResult,
  isAffordabilityCollapsed,
  setIsAffordabilityCollapsed,
}: OnboardingFinancialSectionProps) {
  const showAgentOptionalBuyerCallout = useAgentOptionalBuyerCalloutVisibility(formData.is_agent);
  const showAffordability =
    homePriceLoading !== undefined &&
    homePriceError !== undefined &&
    homePriceResult !== undefined &&
    isAffordabilityCollapsed !== undefined &&
    setIsAffordabilityCollapsed !== undefined;
  return (
    <ProfileSectionBody>
      <Title size="lg" className="mb-4 sm:mb-6">
        {SECTION_TITLES.FINANCIAL_PROFILE}
      </Title>
      {showAgentOptionalBuyerCallout && (
        <ProfileSectionCallout>{AGENT_OPTIONAL_BUYER_FINANCIAL_HINT}</ProfileSectionCallout>
      )}

      <Box className="col-span-1 flex flex-col items-center md:col-span-2">
        <Box className="mb-2 flex w-full flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <Label className="text-responsive-lg text-text-secondary min-w-0 flex-1 text-left font-bold">
            {FIELD_LABELS.HOME_BUDGET} *
          </Label>
          <Pressable
            type="button"
            onPress={() =>
              setPayingCash(!formData.paying_cash, (field, value) => updateFormData(field, value))
            }
            className="flex shrink-0 flex-row items-center gap-2 bg-transparent p-0 text-left"
            label={FIELD_LABELS.PAYING_WITH_CASH}
          >
            <OliveCheckbox checked={!!formData.paying_cash} />
            <BodyText size="sm" className="text-text-primary">
              {FIELD_LABELS.PAYING_WITH_CASH}
            </BodyText>
          </Pressable>
        </Box>
        <BudgetSlider
          tickValues={[
            200000, 400000, 600000, 1000000, 1500000, 2500000, 4000000, 6000000, 10000000,
          ]}
          minValue={formData.home_budget_min ?? 200000}
          maxValue={formData.home_budget_max ?? 1000000}
          onChange={(minValue, maxValue) => {
            const roundedMin = Math.round(minValue / 25000) * 25000;
            const roundedMax = Math.round(maxValue / 25000) * 25000;
            updateFormData("home_budget_min", roundedMin);
            updateFormData("home_budget_max", roundedMax);
          }}
          formatPrefix="$"
          className="mt-2"
        />
      </Box>

      {!formData.paying_cash && (
        <>
          <Box className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Box className="mx-auto w-4/5">
              <Label className="text-text-secondary mb-1 block w-full text-center text-xs font-normal sm:text-sm md:text-base">
                {FIELD_LABELS.GROSS_INCOME} (after debts)
              </Label>
              <PriceRangeSlider
                tickValues={[50000, 100000, 200000, 300000, 500000, 750000, 1000000]}
                value={formData.gross_income ?? 100000}
                onChange={(value) => {
                  const roundedValue = Math.round(value / 5000) * 5000;
                  updateFormData("gross_income", roundedValue);
                }}
                formatPrefix="$"
                className="mt-2"
              />
            </Box>

            <Box className="mx-auto w-4/5">
              <Label className="text-text-secondary mb-1 block w-full text-center text-xs font-normal sm:text-sm md:text-base">
                {FIELD_LABELS.DOWN_PAYMENT}
              </Label>
              <PriceRangeSlider
                tickValues={[0, 100000, 250000, 500000, 1000000, 2000000, 5000000]}
                value={formData.down_payment ?? 0}
                onChange={(value) => {
                  const roundedValue = Math.round(value / 5000) * 5000;
                  updateFormData("down_payment", roundedValue);
                }}
                formatPrefix="$"
                className="mt-2"
              />
            </Box>

            <Box>
              <OnPerLabel required={REQUIRED_FIELDS_ONBOARDING.ideal_zip_code}>
                {FIELD_LABELS.IDEAL_ZIP_CODE}
              </OnPerLabel>
              <Input
                variant="mobile"
                type="text"
                value={formData.ideal_zip_code ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFormData("ideal_zip_code", e.target.value)
                }
                placeholder="Enter zip code"
              />
            </Box>

            <Box>
              <OnPerLabel required={REQUIRED_FIELDS_ONBOARDING.credit_score_range}>
                {FIELD_LABELS.CREDIT_SCORE_RANGE}
              </OnPerLabel>
              <Dropdown
                value={formData.credit_score_range ?? ""}
                onChange={(value) => updateFormData("credit_score_range", value)}
                options={CREDIT_SCORE_OPTIONS}
                placeholder="Select credit score range"
              />
            </Box>

            {showAffordability && (
              <HomePriceEstimate
                homePriceLoading={homePriceLoading!}
                homePriceError={homePriceError}
                homePriceResult={homePriceResult!}
                isAffordabilityCollapsed={isAffordabilityCollapsed!}
                setIsAffordabilityCollapsed={setIsAffordabilityCollapsed!}
                idealZipCode={formData.ideal_zip_code}
              />
            )}
          </Box>
        </>
      )}
    </ProfileSectionBody>
  );
}
