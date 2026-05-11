import React from "react";

import Input from "@ui/form/Input";

import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { OliveCheckbox } from "packages/ui";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { MOBILE_TEXT_INPUT_CLASS } from "packages/ui/styles/native/nativeFormStyles.native";
import type { HomePriceResult } from "packages/utils/affordability";

import {
  AGENT_OPTIONAL_BUYER_FINANCIAL_HINT,
  CREDIT_SCORE_OPTIONS,
  effectiveIsAgentForOptionalBuyerUi,
  FIELD_LABELS,
  type OnboardingData,
  SECTION_TITLES,
  setPayingCash,
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
  const authIsAgent = useIsAgent();
  const showAgentOptionalBuyerCallout = effectiveIsAgentForOptionalBuyerUi({
    authIsAgent,
    formIsAgent: formData.is_agent,
  });
  const parseCurrency = (value: string): number | undefined => {
    const numeric = value.replace(/[^\d]/g, "");
    if (!numeric) return undefined;
    const parsed = Number.parseInt(numeric, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  return (
    <Box className="gap-5">
      <Text className="text-text-primary text-lg font-semibold">
        {SECTION_TITLES.FINANCIAL_PROFILE}
      </Text>
      {showAgentOptionalBuyerCallout && (
        <Box className="border-border bg-background-surface rounded-lg border px-3 py-2">
          <Text className="text-text-secondary text-xs">{AGENT_OPTIONAL_BUYER_FINANCIAL_HINT}</Text>
        </Box>
      )}

      <Box className="gap-3">
        <Box className="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <Text className="text-text-secondary min-w-0 flex-1 text-left text-xs font-medium">
            {FIELD_LABELS.HOME_BUDGET}
          </Text>
          <Pressable
            onPress={() =>
              setPayingCash(!formData.paying_cash, (field, value) => updateFormData(field, value))
            }
            className="flex shrink-0 flex-row items-center gap-2"
            label={FIELD_LABELS.PAYING_WITH_CASH}
          >
            <OliveCheckbox checked={!!formData.paying_cash} />
            <Text className="text-text-primary shrink-0 text-sm">
              {FIELD_LABELS.PAYING_WITH_CASH}
            </Text>
          </Pressable>
        </Box>
        <Box className="flex flex-row gap-3">
          <Box className="flex-1">
            <Text className="text-text-secondary mb-1 text-xs font-medium">Min</Text>
            <Input
              value={formData.home_budget_min?.toString() ?? ""}
              onValueChange={(v) => updateFormData("home_budget_min", parseCurrency(v ?? ""))}
              placeholder="$200,000"
              keyboardType="number-pad"
              className={MOBILE_TEXT_INPUT_CLASS}
            />
          </Box>
          <Box className="flex-1">
            <Text className="text-text-secondary mb-1 text-xs font-medium">Max</Text>
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

      {!formData.paying_cash && (
        <>
          <Box>
            <Text className="text-text-secondary mb-2 text-sm font-medium">
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
            <Text className="text-text-secondary mb-2 text-sm font-medium">
              {FIELD_LABELS.DOWN_PAYMENT}
            </Text>
            <Input
              value={formData.down_payment?.toString() ?? ""}
              onValueChange={(v) => updateFormData("down_payment", parseCurrency(v ?? ""))}
              placeholder="$100,000"
              keyboardType="number-pad"
              className={MOBILE_TEXT_INPUT_CLASS}
            />
          </Box>

          <Box>
            <Text className="text-text-secondary mb-2 text-sm font-medium">
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
            <Text className="text-text-secondary mb-2 text-sm font-medium">
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
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-border bg-background-surface"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        isSelected ? "text-primary" : "text-text-secondary"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </Box>
          </Box>

          <Box className="border-border bg-background-surface mt-4 rounded-2xl border px-4 py-3">
            <Pressable
              onPress={() => setIsAffordabilityCollapsed(!isAffordabilityCollapsed)}
              className="flex flex-row items-center justify-between"
            >
              <Text className="text-text-primary text-sm font-semibold">
                See what you can likely afford
              </Text>
              <Text className="text-primary text-xs font-medium">
                {isAffordabilityCollapsed ? "Show" : "Hide"}
              </Text>
            </Pressable>

            {!isAffordabilityCollapsed && (
              <Box className="mt-3 gap-2">
                {homePriceLoading && (
                  <Text className="text-text-secondary text-xs">Calculating your estimate…</Text>
                )}
                {!homePriceLoading && homePriceError && (
                  <Text className="text-xs text-red-600">{homePriceError}</Text>
                )}
                {!homePriceLoading && !homePriceError && homePriceResult && (
                  <>
                    <Text className="text-text-secondary text-xs">
                      Based on your income, down payment, credit, and ZIP, you could likely afford a
                      home up to:
                    </Text>
                    <Text className="text-text-primary text-xl font-semibold">
                      ${homePriceResult.maxHomePrice.toLocaleString()}
                    </Text>
                    <Text className="text-text-secondary mt-1 text-xs">
                      Estimated total monthly housing cost around $
                      {homePriceResult.totalMonthlyHousingCost.toLocaleString()}.
                    </Text>
                  </>
                )}
                {!homePriceLoading && !homePriceError && !homePriceResult && (
                  <Text className="text-text-secondary text-xs">
                    Fill in income, down payment, credit score, and ZIP to see an affordability
                    estimate.
                  </Text>
                )}
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
