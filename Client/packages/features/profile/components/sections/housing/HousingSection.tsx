import React from "react";

import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { Title } from "@/components/ui";
import BudgetSlider from "@/features/profile/components/settings/inputs/BudgetSlider";
import {
  AGENT_OPTIONAL_BUYER_SEARCH_PREFERENCES_HINT,
  effectiveIsAgentForOptionalBuyerUi,
  FIELD_LABELS,
  type OnboardingData,
  SECTION_TITLES,
} from "@/features/profile/utils";

import { HousingBasicRows } from "./HousingBasicRows";
import { HousingDropdownRows } from "./HousingDropdownRows";
import { HousingRangeRows } from "./HousingRangeRows";
import { HousingTagRows } from "./HousingTagRows";

const BUDGET_TICK_VALUES = [
  200000, 400000, 600000, 1000000, 1500000, 2500000, 4000000, 6000000, 10000000,
];
type HousingSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  isDesktop: boolean;
  wrapInCard?: boolean;
  /** When false, budget slider is hidden (e.g. Define Criteria context). Default true. */
  showBudgetSlider?: boolean;
};

export default function HousingSection({
  formData,
  isEditMode,
  updateFormData,
  isDesktop,
  wrapInCard = true,
  showBudgetSlider = true,
}: HousingSectionProps) {
  const authIsAgent = useIsAgent();
  const showAgentOptionalBuyerCallout = effectiveIsAgentForOptionalBuyerUi({
    authIsAgent,
    formIsAgent: formData.is_agent,
  });
  const content = (
    <>
      <Title size="md" className="mb-2">
        {SECTION_TITLES.HOUSING_PREFERENCES}
      </Title>
      {showAgentOptionalBuyerCallout && (
        <Box className="border-border bg-background-surface mb-4 rounded-lg border px-3 py-2">
          <Box className="text-text-secondary text-xs">
            {AGENT_OPTIONAL_BUYER_SEARCH_PREFERENCES_HINT}
          </Box>
        </Box>
      )}

      {showBudgetSlider && (
        <Box className="mb-4">
          <Title size="sm" className="mb-2 text-center text-base">
            {FIELD_LABELS.HOME_BUDGET}
          </Title>
          {isEditMode ? (
            <BudgetSlider
              tickValues={BUDGET_TICK_VALUES}
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
                ${(formData.home_budget_min ?? 0).toLocaleString()} – $
                {(formData.home_budget_max ?? 0).toLocaleString()}
              </Box>
            </Box>
          )}
        </Box>
      )}

      <HousingBasicRows
        formData={formData}
        isEditMode={isEditMode}
        updateFormData={updateFormData}
      />

      <HousingRangeRows
        formData={formData}
        isEditMode={isEditMode}
        updateFormData={updateFormData}
      />

      <HousingTagRows formData={formData} isEditMode={isEditMode} updateFormData={updateFormData} />

      <HousingDropdownRows
        formData={formData}
        isEditMode={isEditMode}
        updateFormData={updateFormData}
        isDesktop={isDesktop}
      />
    </>
  );

  return wrapInCard ? (
    <Card border="light" className="space-y-6">
      {content}
    </Card>
  ) : (
    <Box className="space-y-6">{content}</Box>
  );
}
