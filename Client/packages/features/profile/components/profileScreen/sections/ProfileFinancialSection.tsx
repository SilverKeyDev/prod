import React, { useCallback } from "react";

import {
  ProfileSectionBody,
  ProfileSectionCallout,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import { SearchPrefsPriceFinancing } from "packages/features/profile/components/profileScreen/searchPreferences/SearchPrefsPriceFinancing";
import type { PatchBuyerPreferenceExtensions } from "packages/features/profile/components/profileScreen/searchPreferences/types";
import { withBuyerExtV1 } from "packages/features/profile/components/profileScreen/searchPreferences/withBuyerExtV1";
import { ProfileCheckbox } from "packages/features/profile/components/settings/inputs/ProfileCheckbox";
import BudgetSlider from "packages/features/profile/components/settings/inputs/sliders/BudgetSlider";
import PriceRangeSlider from "packages/features/profile/components/settings/inputs/sliders/PriceRangeSlider";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/buyerPreferenceExtensions";
import type { OnboardingData } from "packages/features/profile/utils";
import {
  AGENT_OPTIONAL_BUYER_FINANCIAL_HINT,
  CREDIT_SCORE_OPTIONS,
  effectiveIsAgentForOptionalBuyerUi,
  FIELD_LABELS,
  PROFILE_NOT_SPECIFIED_LABEL,
  SECTION_TITLES,
  setPayingCash,
} from "packages/features/profile/utils";
import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { Input } from "packages/ui/components/form/Input";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
import type { HomePriceResult } from "packages/utils/affordability";

import { ProfileReadOnlyValue } from "./ProfileReadOnlyValue";

function getOptionLabel(
  options: readonly { value: string; label: string }[],
  value?: string
): string {
  if (!value) return PROFILE_NOT_SPECIFIED_LABEL;
  return options.find((opt) => opt.value === value)?.label ?? PROFILE_NOT_SPECIFIED_LABEL;
}

type ProfileFinancialSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
  /** When provided, the affordability estimate block is shown (e.g. in checklist Set budget). */
  homePriceResult?: HomePriceResult | null;
  homePriceLoading?: boolean;
  homePriceError?: string | null;
};

export function ProfileFinancialSection({
  formData,
  isEditMode,
  updateField,
  patchBuyerPreferenceExtensions,
  homePriceResult,
  homePriceLoading,
  homePriceError,
}: ProfileFinancialSectionProps) {
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();
  const authIsAgent = useIsAgent();
  const showAgentOptionalBuyerCallout = effectiveIsAgentForOptionalBuyerUi({
    authIsAgent,
    formIsAgent: formData.is_agent,
  });
  const showAffordabilityBlock =
    homePriceLoading !== undefined || homePriceError !== undefined || homePriceResult !== undefined;

  const patch = useCallback(
    (fn: (prev: BuyerPreferenceExtensions | undefined) => BuyerPreferenceExtensions) => {
      patchBuyerPreferenceExtensions(fn);
    },
    [patchBuyerPreferenceExtensions]
  );

  const minB = formData.home_budget_min;
  const maxB = formData.home_budget_max;
  const budgetSummary =
    minB != null || maxB != null
      ? `${minB != null ? `$${Math.round(minB).toLocaleString()}` : "—"} – ${
          maxB != null ? `$${Math.round(maxB).toLocaleString()}` : "—"
        }`
      : PROFILE_NOT_SPECIFIED_LABEL;

  const ext = withBuyerExtV1(formData.buyerPreferenceExtensions);
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
            <Text className="text-text-primary text-center text-base">
              ${(formData.home_budget_min ?? 0).toLocaleString()} – $
              {(formData.home_budget_max ?? 0).toLocaleString()}
            </Text>
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
          <Box className="flex flex-row flex-wrap gap-4">
            <Box className="min-w-0 flex-1">
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
            <Box className="min-w-0 flex-1">
              <BodyText size="sm" className="text-text-secondary mb-2 font-medium">
                {FIELD_LABELS.DOWN_PAYMENT}
              </BodyText>
              {isEditMode ? (
                <PriceRangeSlider
                  tickValues={[100000, 250000, 500000, 1000000, 2000000, 5000000]}
                  value={formData.down_payment ?? 100000}
                  onChange={(v) => {
                    updateField("down_payment", Math.round(v / 5000) * 5000);
                  }}
                  formatPrefix="$"
                  className="mt-2"
                />
              ) : (
                <ProfileReadOnlyValue
                  value={
                    formData.down_payment ? `$${formData.down_payment.toLocaleString()}` : undefined
                  }
                />
              )}
            </Box>
          </Box>

          {/* Row: Zip code | Credit score range */}
          <Box className="flex flex-row flex-wrap gap-4">
            <Box className="min-w-0 flex-1">
              <BodyText size="sm" className="text-text-secondary mb-2 font-medium">
                {FIELD_LABELS.IDEAL_ZIP_CODE}
              </BodyText>
              {isEditMode ? (
                <Input
                  type="text"
                  value={formData.ideal_zip_code ?? ""}
                  onChange={(e) => updateField("ideal_zip_code", e.target.value || undefined)}
                  placeholder="e.g. 90210"
                  className="mt-2"
                />
              ) : (
                <ProfileReadOnlyValue value={formData.ideal_zip_code} />
              )}
            </Box>
            <Box className="min-w-0 flex-1">
              <BodyText size="sm" className="text-text-secondary mb-2 font-medium">
                {FIELD_LABELS.CREDIT_SCORE_RANGE}
              </BodyText>
              {isEditMode ? (
                <Box className="flex-row flex-wrap gap-2">
                  {CREDIT_SCORE_OPTIONS.map((option) => {
                    const selected = formData.credit_score_range === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => updateField("credit_score_range", option.value)}
                        className={`rounded-full px-4 py-2 ${
                          selected ? "bg-primary" : "border-border bg-background-surface border"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            selected ? "text-white" : "text-text-primary"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </Box>
              ) : (
                <ProfileReadOnlyValue
                  value={getOptionLabel(CREDIT_SCORE_OPTIONS, formData.credit_score_range)}
                />
              )}
            </Box>
          </Box>

          {showAffordabilityBlock && (
            <Box className="border-border bg-background-surface mt-2 rounded-lg border px-4 py-3">
              <Text className="text-text-primary text-base font-semibold">
                Affordability estimate
              </Text>

              {homePriceLoading ? (
                <Box className="mt-2">
                  <Text className="text-text-secondary text-sm">Calculating estimate…</Text>
                </Box>
              ) : homePriceError ? (
                <Box className="mt-2">
                  <Text className="text-sm text-red-500">{homePriceError}</Text>
                </Box>
              ) : homePriceResult ? (
                <Box className="mt-3 gap-1">
                  <Text className="text-text-primary text-sm">
                    Estimated max home price:{" "}
                    <Text className="font-semibold">
                      ${homePriceResult.maxHomePrice.toLocaleString()}
                    </Text>
                  </Text>
                  <Text className="text-text-primary text-sm">
                    Estimated monthly housing cost:{" "}
                    <Text className="font-semibold">
                      ${homePriceResult.totalMonthlyHousingCost.toLocaleString()}
                    </Text>
                  </Text>
                  <Text className="text-text-secondary mt-1 text-xs">
                    This estimate uses your income, down payment, and credit band to give a
                    realistic upper bound on what you can comfortably afford.
                  </Text>
                </Box>
              ) : (
                <Box className="mt-2">
                  <Text className="text-text-secondary text-sm">
                    Enter your income and ideal zip code to see an affordability estimate.
                  </Text>
                </Box>
              )}
            </Box>
          )}
        </>
      )}
    </ProfileSectionBody>
  );
}
