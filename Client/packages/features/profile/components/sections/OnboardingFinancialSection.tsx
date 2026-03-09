import React from "react";

import { Dropdown, Input, Label, Title } from "@/components/ui";
import BudgetRangeSlider from "@/features/profile/components/settings/inputs/BudgetRangeSlider";
import HomePriceEstimate from "@/features/profile/components/settings/inputs/HomePriceEstimate";
import { OnPerLabel } from "@/features/profile/components/settings/inputs/Label";
import PriceRangeSlider from "@/features/profile/components/settings/inputs/PriceRangeSlider";
import {
  CREDIT_SCORE_OPTIONS,
  FIELD_LABELS,
  type HomePriceResult,
  type OnboardingData,
  REQUIRED_FIELDS_ONBOARDING,
  SECTION_TITLES,
} from "@/features/profile/utils";

type OnboardingFinancialSectionProps = {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  homePriceLoading: boolean;
  homePriceError: string | null;
  homePriceResult: HomePriceResult | null;
  isAffordabilityCollapsed: boolean;
  setIsAffordabilityCollapsed: (value: boolean) => void;
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
  return (
    <div className="space-y-6">
      <Title size="lg" className="mb-4 sm:mb-6">
        {SECTION_TITLES.FINANCIAL_PROFILE}
      </Title>
      <div className="col-span-1 flex flex-col items-center md:col-span-2">
        <Label className="text-responsive-xl space-y-responsive-xs block w-full text-center font-bold text-gray-700">
          {FIELD_LABELS.HOME_BUDGET} *
        </Label>
        <BudgetRangeSlider
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
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="mx-auto w-4/5">
          <Label className="mb-1 block w-full text-center text-xs font-normal text-gray-700 sm:text-sm md:text-base">
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
        </div>

        <div className="mx-auto w-4/5">
          <Label className="mb-1 block w-full text-center text-xs font-normal text-gray-700 sm:text-sm md:text-base">
            {FIELD_LABELS.DOWN_PAYMENT}
          </Label>
          <PriceRangeSlider
            tickValues={[100000, 250000, 500000, 1000000, 2000000, 5000000]}
            value={formData.down_payment ?? 100000}
            onChange={(value) => {
              const roundedValue = Math.round(value / 5000) * 5000;
              updateFormData("down_payment", roundedValue);
            }}
            formatPrefix="$"
            className="mt-2"
          />
        </div>

        <div>
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
        </div>

        <div>
          <OnPerLabel required={REQUIRED_FIELDS_ONBOARDING.credit_score_range}>
            {FIELD_LABELS.CREDIT_SCORE_RANGE}
          </OnPerLabel>
          <Dropdown
            value={formData.credit_score_range ?? ""}
            onChange={(value) => updateFormData("credit_score_range", value)}
            options={CREDIT_SCORE_OPTIONS}
            placeholder="Select credit score range"
          />
        </div>

        <HomePriceEstimate
          homePriceLoading={homePriceLoading}
          homePriceError={homePriceError}
          homePriceResult={homePriceResult}
          isAffordabilityCollapsed={isAffordabilityCollapsed}
          setIsAffordabilityCollapsed={setIsAffordabilityCollapsed}
          idealZipCode={formData.ideal_zip_code}
        />
      </div>
    </div>
  );
}
