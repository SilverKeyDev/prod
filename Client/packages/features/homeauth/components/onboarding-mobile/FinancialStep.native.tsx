import React from "react";

import Input from "@ui/form/Input";

import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { MOBILE_TEXT_INPUT_CLASS } from "packages/ui/styles/nativeFormStyles.native";

import {
  CREDIT_SCORE_OPTIONS,
  FIELD_LABELS,
  type HomePriceResult,
  type OnboardingData,
  SECTION_TITLES,
} from "@/features/profile/utils";

type FinancialStepProps = {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  homePriceLoading: boolean;
  homePriceError: string | null;
  homePriceResult: HomePriceResult | null;
  isAffordabilityCollapsed: boolean;
  setIsAffordabilityCollapsed: (value: boolean) => void;
};

export function FinancialStep({
  formData,
  updateFormData,
  homePriceLoading,
  homePriceError,
  homePriceResult,
  isAffordabilityCollapsed,
  setIsAffordabilityCollapsed,
}: FinancialStepProps) {
  const parseCurrency = (value: string): number | undefined => {
    const numeric = value.replace(/[^\d]/g, "");
    if (!numeric) return undefined;
    const parsed = Number.parseInt(numeric, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  return (
    <Box className="gap-5">
      <Text className="text-lg font-semibold text-gray-900">
        {SECTION_TITLES.FINANCIAL_PROFILE}
      </Text>

      <Box className="gap-3">
        <Text className="mb-1 text-sm font-medium text-gray-700">{FIELD_LABELS.HOME_BUDGET}</Text>
        <Box className="flex flex-row gap-3">
          <Box className="flex-1">
            <Text className="mb-1 text-xs font-medium text-gray-600">Min</Text>
            <Input
              value={formData.home_budget_min?.toString() ?? ""}
              onValueChange={(v) => updateFormData("home_budget_min", parseCurrency(v ?? ""))}
              placeholder="$200,000"
              keyboardType="number-pad"
              className={MOBILE_TEXT_INPUT_CLASS}
            />
          </Box>
          <Box className="flex-1">
            <Text className="mb-1 text-xs font-medium text-gray-600">Max</Text>
            <Input
              value={formData.home_budget_max?.toString() ?? ""}
              onValueChange={(v) => updateFormData("home_budget_max", parseCurrency(v ?? ""))}
              placeholder="$1,000,000"
              keyboardType="number-pad"
              className={MOBILE_TEXT_INPUT_CLASS}
            />
          </Box>
        </Box>
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.GROSS_INCOME} (after debts)
        </Text>
        <Input
          value={formData.gross_income?.toString() ?? ""}
          onValueChange={(v) => updateFormData("gross_income", parseCurrency(v ?? ""))}
          placeholder="$100,000"
          keyboardType="number-pad"
          className={MOBILE_TEXT_INPUT_CLASS}
        />
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">{FIELD_LABELS.DOWN_PAYMENT}</Text>
        <Input
          value={formData.down_payment?.toString() ?? ""}
          onValueChange={(v) => updateFormData("down_payment", parseCurrency(v ?? ""))}
          placeholder="$100,000"
          keyboardType="number-pad"
          className={MOBILE_TEXT_INPUT_CLASS}
        />
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.IDEAL_ZIP_CODE}
        </Text>
        <Input
          value={formData.ideal_zip_code ?? ""}
          onValueChange={(v) => updateFormData("ideal_zip_code", v ?? "")}
          placeholder="Enter zip code"
          keyboardType="number-pad"
          className={MOBILE_TEXT_INPUT_CLASS}
        />
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.CREDIT_SCORE_RANGE}
        </Text>
        <Box className="flex flex-row flex-wrap gap-2">
          {CREDIT_SCORE_OPTIONS.map((option) => {
            const isSelected = formData.credit_score_range === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => updateFormData("credit_score_range", option.value)}
                className={`rounded-lg border px-3 py-2 ${
                  isSelected ? "border-brand-accent bg-brand-accent/10" : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    isSelected ? "text-brand-accent" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </Box>

      <Box className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-3">
        <Pressable
          onPress={() => setIsAffordabilityCollapsed(!isAffordabilityCollapsed)}
          className="flex flex-row items-center justify-between"
        >
          <Text className="text-sm font-semibold text-gray-900">
            See what you can likely afford
          </Text>
          <Text className="text-brand-accent text-xs font-medium">
            {isAffordabilityCollapsed ? "Show" : "Hide"}
          </Text>
        </Pressable>

        {!isAffordabilityCollapsed && (
          <Box className="mt-3 gap-2">
            {homePriceLoading && (
              <Text className="text-xs text-gray-600">Calculating your estimate…</Text>
            )}
            {!homePriceLoading && homePriceError && (
              <Text className="text-xs text-red-600">{homePriceError}</Text>
            )}
            {!homePriceLoading && !homePriceError && homePriceResult && (
              <>
                <Text className="text-xs text-gray-600">
                  Based on your income, down payment, credit, and ZIP, you could likely afford a
                  home up to:
                </Text>
                <Text className="text-xl font-semibold text-gray-900">
                  ${homePriceResult.maxHomePrice.toLocaleString()}
                </Text>
                <Text className="mt-1 text-xs text-gray-600">
                  Estimated total monthly housing cost around $
                  {homePriceResult.totalMonthlyHousingCost.toLocaleString()}.
                </Text>
              </>
            )}
            {!homePriceLoading && !homePriceError && !homePriceResult && (
              <Text className="text-xs text-gray-500">
                Fill in income, down payment, credit score, and ZIP to see an affordability
                estimate.
              </Text>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
