import React from "react";

import {
  ProfileSectionBody,
  ProfileSectionCallout,
} from "packages/features/profile/components/layout";
import { SearchPrefsPriceFinancing } from "packages/features/profile/components/profileScreen/searchPreferences/SearchPrefsPriceFinancing";
import { ProfileReadOnlyValue } from "packages/features/profile/components/profileScreen/sections/shared/ProfileReadOnlyValue";
import { ProfileCheckbox } from "packages/features/profile/components/settings/inputs/ProfileCheckbox";
import BudgetSlider from "packages/features/profile/components/settings/inputs/sliders/BudgetSlider";
import PriceRangeSlider from "packages/features/profile/components/settings/inputs/sliders/PriceRangeSlider";
import type { ProfileFinancialSectionProps } from "packages/features/profile/hooks";
import {
  getCreditScoreOptionLabel,
  useProfileFinancialSectionModel,
} from "packages/features/profile/hooks";
import {
  AGENT_OPTIONAL_BUYER_FINANCIAL_HINT,
  CREDIT_SCORE_OPTIONS,
  FIELD_LABELS,
  SECTION_TITLES,
  setPayingCash,
} from "packages/features/profile/utils";
import { Dropdown, Input } from "packages/ui";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

export type { ProfileFinancialSectionProps };

export function ProfileFinancialSection({
  formData,
  isEditMode,
  updateField,
  patchBuyerPreferenceExtensions,
  homePriceResult,
  homePriceLoading,
  homePriceError,
}: ProfileFinancialSectionProps) {
  const {
    showSectionTitle,
    showAgentOptionalBuyerCallout,
    showAffordabilityBlock,
    patch,
    budgetSummary,
    ext,
  } = useProfileFinancialSectionModel({
    formData,
    patchBuyerPreferenceExtensions,
    homePriceResult,
    homePriceLoading,
    homePriceError,
  });

  return (
    <ProfileSectionBody>
      {showSectionTitle && <Title size="md">{SECTION_TITLES.FINANCIAL_PROFILE}</Title>}
      {showAgentOptionalBuyerCallout && (
        <ProfileSectionCallout>{AGENT_OPTIONAL_BUYER_FINANCIAL_HINT}</ProfileSectionCallout>
      )}

      <Box>
        <Box className="mb-2 flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <BodyText size="xs" className="text-text-secondary min-w-0 flex-1 font-medium">
            {FIELD_LABELS.HOME_BUDGET}
          </BodyText>
          <ProfileCheckbox
            isEditMode={isEditMode}
            checked={!!formData.paying_cash}
            label={FIELD_LABELS.PAYING_WITH_CASH}
            onToggle={() => setPayingCash(!formData.paying_cash, updateField)}
            className="shrink-0"
          />
        </Box>
        {isEditMode ? (
          <BudgetSlider
            tickValues={[
              200000, 400000, 600000, 1000000, 1500000, 2500000, 4000000, 6000000, 10000000,
            ]}
            minValue={formData.home_budget_min ?? 200000}
            maxValue={formData.home_budget_max ?? 1000000}
            onChange={(minVal, maxVal) => {
              const roundedMin = Math.round(minVal / 25000) * 25000;
              const roundedMax = Math.round(maxVal / 25000) * 25000;
              updateField("home_budget_min", roundedMin);
              updateField("home_budget_max", roundedMax);
            }}
            formatPrefix="$"
            className="mt-2"
          />
        ) : (
          <Box className="border-border bg-background-base mt-2 rounded-lg border px-4 py-3">
            <BodyText size="sm" className="text-text-primary text-center">
              ${(formData.home_budget_min ?? 0).toLocaleString()} – $
              {(formData.home_budget_max ?? 0).toLocaleString()}
            </BodyText>
          </Box>
        )}
      </Box>

      <SearchPrefsPriceFinancing
        isEditMode={isEditMode}
        patch={patch}
        budgetSummary={budgetSummary}
        pf={ext.price_financing ?? {}}
      />

      {!formData.paying_cash && (
        <>
          {/* Row: Income | Down payment */}
          <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Box>
              <BodyText size="sm" className="text-text-secondary mb-2 font-medium">
                {FIELD_LABELS.GROSS_INCOME}
              </BodyText>
              {isEditMode ? (
                <PriceRangeSlider
                  tickValues={[50000, 100000, 200000, 300000, 500000, 750000, 1000000]}
                  value={formData.gross_income ?? 100000}
                  onChange={(v) => {
                    updateField("gross_income", Math.round(v / 5000) * 5000);
                  }}
                  formatPrefix="$"
                  className="mt-2"
                />
              ) : (
                <ProfileReadOnlyValue
                  value={
                    formData.gross_income ? `$${formData.gross_income.toLocaleString()}` : undefined
                  }
                />
              )}
            </Box>
            <Box>
              <BodyText size="sm" className="text-text-secondary mb-2 font-medium">
                {FIELD_LABELS.DOWN_PAYMENT}
              </BodyText>
              {isEditMode ? (
                <PriceRangeSlider
                  tickValues={[0, 100000, 250000, 500000, 1000000, 2000000, 5000000]}
                  value={formData.down_payment ?? 0}
                  onChange={(v) => {
                    updateField("down_payment", Math.round(v / 5000) * 5000);
                  }}
                  formatPrefix="$"
                  className="mt-2"
                />
              ) : (
                <ProfileReadOnlyValue
                  value={
                    formData.down_payment != null
                      ? `$${formData.down_payment.toLocaleString()}`
                      : undefined
                  }
                />
              )}
            </Box>
          </Box>

          {/* Row: Zip code | Credit score range (dropdown) */}
          <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Box>
              <BodyText size="sm" className="text-text-secondary mb-2 font-medium">
                {FIELD_LABELS.IDEAL_ZIP_CODE}
              </BodyText>
              {isEditMode ? (
                <Input
                  type="text"
                  value={formData.ideal_zip_code ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("ideal_zip_code", e.target.value || undefined)
                  }
                  placeholder="e.g. 90210"
                />
              ) : (
                <ProfileReadOnlyValue value={formData.ideal_zip_code} />
              )}
            </Box>
            <Box>
              <BodyText size="sm" className="text-text-secondary mb-2 font-medium">
                {FIELD_LABELS.CREDIT_SCORE_RANGE}
              </BodyText>
              {isEditMode ? (
                <Dropdown
                  value={formData.credit_score_range ?? ""}
                  onChange={(value) => updateField("credit_score_range", value)}
                  options={CREDIT_SCORE_OPTIONS}
                  placeholder="Select credit score range"
                />
              ) : (
                <ProfileReadOnlyValue
                  value={getCreditScoreOptionLabel(
                    CREDIT_SCORE_OPTIONS,
                    formData.credit_score_range
                  )}
                />
              )}
            </Box>
          </Box>

          {showAffordabilityBlock && (
            <Box className="border-border bg-background-surface mt-2 rounded-lg border px-4 py-3">
              <BodyText size="sm" className="text-text-primary font-semibold">
                Affordability estimate
              </BodyText>

              {homePriceLoading ? (
                <Box className="mt-2">
                  <BodyText size="xs" className="text-text-secondary">
                    Calculating estimate…
                  </BodyText>
                </Box>
              ) : homePriceError ? (
                <Box className="mt-2">
                  <BodyText size="xs" className="text-red-500">
                    {homePriceError}
                  </BodyText>
                </Box>
              ) : homePriceResult ? (
                <Box className="mt-3 flex flex-col gap-1">
                  <BodyText size="sm" className="text-text-primary">
                    Estimated max home price:{" "}
                    <BodyText as="span" size="sm" className="text-text-primary font-semibold">
                      ${homePriceResult.maxHomePrice.toLocaleString()}
                    </BodyText>
                  </BodyText>
                  <BodyText size="sm" className="text-text-primary">
                    Estimated monthly housing cost:{" "}
                    <BodyText as="span" size="sm" className="text-text-primary font-semibold">
                      ${homePriceResult.totalMonthlyHousingCost.toLocaleString()}
                    </BodyText>
                  </BodyText>
                  <BodyText size="xs" className="text-text-secondary mt-1">
                    This estimate uses your income, down payment, and credit band to give a
                    realistic upper bound on what you can comfortably afford.
                  </BodyText>
                </Box>
              ) : (
                <Box className="mt-2">
                  <BodyText size="xs" className="text-text-secondary">
                    Enter your income and ideal zip code to see an affordability estimate.
                  </BodyText>
                </Box>
              )}
            </Box>
          )}
        </>
      )}
    </ProfileSectionBody>
  );
}
