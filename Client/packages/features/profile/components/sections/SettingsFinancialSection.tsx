import React, { useCallback } from "react";

import {
  PROFILE_FIELDS_ROW_PROPS,
  ProfileSectionBody,
  ProfileSectionCallout,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import { useAgentOptionalBuyerCalloutVisibility } from "packages/features/profile/hooks/useAgentOptionalBuyerCalloutVisibility";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import { OliveCheckbox } from "packages/ui";
import { Box, Pressable } from "packages/ui/components/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import { BodyText, Dropdown, Input, Title } from "@/components/ui";
import { SearchPrefsPriceFinancing } from "@/features/profile/components/profileScreen/searchPreferences/SearchPrefsPriceFinancing";
import type { PatchBuyerPreferenceExtensions } from "@/features/profile/components/profileScreen/searchPreferences/types";
import { withBuyerExtV1 } from "@/features/profile/components/profileScreen/searchPreferences/withBuyerExtV1";
import Label from "@/features/profile/components/settings/inputs/Label";
import BudgetSlider from "@/features/profile/components/settings/inputs/sliders/BudgetSlider";
import PriceRangeSlider from "@/features/profile/components/settings/inputs/sliders/PriceRangeSlider";
import {
  AGENT_OPTIONAL_BUYER_FINANCIAL_HINT,
  CREDIT_SCORE_OPTIONS,
  FIELD_LABELS,
  type OnboardingData,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
  setPayingCash,
} from "@/features/profile/utils";

type SettingsFinancialSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
};

export function SettingsFinancialSection({
  formData,
  isEditMode,
  updateFormData,
  patchBuyerPreferenceExtensions,
}: SettingsFinancialSectionProps) {
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();
  const showAgentOptionalBuyerCallout = useAgentOptionalBuyerCalloutVisibility(formData);

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
      {showSectionTitle && (
        <Title size="md" className="mb-6">
          Financial Information
        </Title>
      )}
      {showAgentOptionalBuyerCallout && (
        <ProfileSectionCallout>{AGENT_OPTIONAL_BUYER_FINANCIAL_HINT}</ProfileSectionCallout>
      )}

      <Box className="col-span-1 flex flex-col items-center md:col-span-2">
        <Box className="mb-2 flex w-full flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <Title size="sm" as="h3" className="min-w-0 flex-1 text-left text-base">
            {FIELD_LABELS.HOME_BUDGET}
          </Title>
          {isEditMode ? (
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
          ) : (
            <Box className="flex shrink-0 flex-row items-center gap-2">
              <OliveCheckbox checked={!!formData.paying_cash} />
              <BodyText size="sm" className="text-text-primary">
                {FIELD_LABELS.PAYING_WITH_CASH}
              </BodyText>
            </Box>
          )}
        </Box>
        {isEditMode ? (
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
        ) : (
          <Box className="mobile-input bg-background-base mt-2 text-center">
            <Box className="text-lg font-normal">
              ${(formData.home_budget_min ?? 0).toLocaleString()} - $
              {(formData.home_budget_max ?? 0).toLocaleString()}
            </Box>
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
          <AlignedRow
            {...PROFILE_FIELDS_ROW_PROPS}
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
                  <Box
                    className={`mobile-input bg-background-base text-left ${
                      formData.gross_income ? "text-text-primary" : "text-text-secondary"
                    }`}
                  >
                    {formData.gross_income
                      ? `$${formData.gross_income.toLocaleString()}`
                      : PROFILE_NOT_SPECIFIED_LABEL}
                  </Box>
                ),
              },
              {
                title: <Label>Down Payment</Label>,
                content: isEditMode ? (
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
                ) : (
                  <Box
                    className={`mobile-input bg-background-base text-left ${
                      formData.down_payment != null ? "text-text-primary" : "text-text-secondary"
                    }`}
                  >
                    {formData.down_payment != null
                      ? `$${formData.down_payment.toLocaleString()}`
                      : PROFILE_NOT_SPECIFIED_LABEL}
                  </Box>
                ),
              },
            ]}
          />

          <AlignedRow
            {...PROFILE_FIELDS_ROW_PROPS}
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
                  <Box
                    className={`mobile-input bg-background-base ${profileFieldValueClassName(
                      formData.ideal_zip_code
                    )}`}
                  >
                    {formData.ideal_zip_code ?? PROFILE_NOT_SPECIFIED_LABEL}
                  </Box>
                ),
              },
              {
                title: <Label>{FIELD_LABELS.CREDIT_SCORE_RANGE}</Label>,
                content: isEditMode ? (
                  <Dropdown
                    value={formData.credit_score_range ?? ""}
                    onChange={(value) => updateFormData("credit_score_range", value)}
                    options={CREDIT_SCORE_OPTIONS}
                    placeholder="Select credit score range"
                  />
                ) : (
                  <Box
                    className={`mobile-input bg-background-base ${profileFieldValueClassName(
                      formData.credit_score_range
                    )}`}
                  >
                    {formData.credit_score_range
                      ? (CREDIT_SCORE_OPTIONS.find(
                          (option) => option.value === formData.credit_score_range
                        )?.label ?? PROFILE_NOT_SPECIFIED_LABEL)
                      : PROFILE_NOT_SPECIFIED_LABEL}
                  </Box>
                ),
              },
            ]}
          />
        </>
      )}
    </ProfileSectionBody>
  );
}
