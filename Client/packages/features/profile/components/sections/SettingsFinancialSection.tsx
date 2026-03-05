import React from "react";

import { Dropdown, Input, Title } from "packages/ui/components/index.web";

import AlignedRow from "@/components/layout/AlignedRow";
import Card from "@/components/layout/Card.web";
import BudgetRangeSlider from "@/features/profile/components/settings/inputs/BudgetRangeSlider";
import HomePriceEstimate from "@/features/profile/components/settings/inputs/HomePriceEstimate";
import Label from "@/features/profile/components/settings/inputs/Label";
import PriceRangeSlider from "@/features/profile/components/settings/inputs/PriceRangeSlider";
import type { HomePriceResult } from "@/features/profile/utils";
import { CREDIT_SCORE_OPTIONS, FIELD_LABELS, type OnboardingData } from "@/features/profile/utils";

type SettingsFinancialSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  homePriceLoading: boolean;
  homePriceError: string | null;
  homePriceResult: HomePriceResult | null;
  isAffordabilityCollapsed: boolean;
  setIsAffordabilityCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

export function SettingsFinancialSection({
  formData,
  isEditMode,
  updateFormData,
  homePriceLoading,
  homePriceError,
  homePriceResult,
  isAffordabilityCollapsed,
  setIsAffordabilityCollapsed,
}: SettingsFinancialSectionProps) {
  return (
    <Card className="mb-64 space-y-6">
      <Title size="md" className="mb-6">
        Financial Information
      </Title>
      <div className="col-span-1 flex flex-col items-center md:col-span-2">
        <Title size="sm" className="mb-2 w-full text-center">
          {FIELD_LABELS.HOME_BUDGET}
        </Title>
        {isEditMode ? (
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
        ) : (
          <div className="mobile-input mt-2 bg-gray-50 text-center">
            <div className="text-lg font-normal">
              ${(formData.home_budget_min ?? 0).toLocaleString()} - $
              {(formData.home_budget_max ?? 0).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <AlignedRow
        breakIntoRows="md"
        gap="lg"
        justify="start"
        items={[
          {
            title: <Label>Gross Annual Income (after debts)</Label>,
            content: isEditMode ? (
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
            ) : (
              <div className="mobile-input bg-gray-50 text-left">
                {formData.gross_income
                  ? `$${formData.gross_income.toLocaleString()}`
                  : "Not specified"}
              </div>
            ),
          },
          {
            title: <Label>Down Payment</Label>,
            content: isEditMode ? (
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
            ) : (
              <div className="mobile-input bg-gray-50 text-left">
                {formData.down_payment
                  ? `$${formData.down_payment.toLocaleString()}`
                  : "Not specified"}
              </div>
            ),
          },
        ]}
      />

      <AlignedRow
        breakIntoRows="md"
        gap="lg"
        justify="evenly"
        items={[
          {
            title: <Label>Ideal Zip Code</Label>,
            content: isEditMode ? (
              <Input
                type="text"
                value={formData.ideal_zip_code ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFormData("ideal_zip_code", e.target.value)
                }
                placeholder="Enter zip code"
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.ideal_zip_code ?? "Not specified"}
              </div>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.CREDIT_SCORE_RANGE}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={formData.credit_score_range ?? ""}
                onChange={(value) => updateFormData("credit_score_range", value)}
                options={CREDIT_SCORE_OPTIONS}
                placeholder="Select..."
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.credit_score_range
                  ? (CREDIT_SCORE_OPTIONS.find(
                      (option) => option.value === formData.credit_score_range
                    )?.label ?? "Not specified")
                  : "Not specified"}
              </div>
            ),
          },
        ]}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <HomePriceEstimate
          homePriceLoading={homePriceLoading}
          homePriceError={homePriceError}
          homePriceResult={homePriceResult}
          isAffordabilityCollapsed={isAffordabilityCollapsed}
          setIsAffordabilityCollapsed={setIsAffordabilityCollapsed}
          idealZipCode={formData.ideal_zip_code}
        />
      </div>
    </Card>
  );
}
