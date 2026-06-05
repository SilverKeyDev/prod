import React from "react";

import {
  ProfileSectionBody,
  ProfileSectionCallout,
  ProfileSectionGroup,
} from "packages/features/profile/components/layout";
import { useAgentOptionalBuyerCalloutVisibility } from "packages/features/profile/hooks/useAgentOptionalBuyerCalloutVisibility";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import { Box } from "packages/ui/components/structure/primitives";

import { Title } from "@/components/ui";
import BudgetSlider from "@/features/profile/components/settings/inputs/sliders/BudgetSlider";
import {
  AGENT_OPTIONAL_BUYER_SEARCH_PREFERENCES_HINT,
  FIELD_LABELS,
  type OnboardingData,
  SECTION_TITLES,
} from "@/features/profile/utils";

import { HousingPreferencesBody } from "./HousingPreferencesBody";

const BUDGET_TICK_VALUES = [
  200000, 400000, 600000, 1000000, 1500000, 2500000, 4000000, 6000000, 10000000,
];
type HousingSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  /** @deprecated Layout is driven inside HousingPreferencesBody via useResponsive. Kept for call-site compatibility. */
  isDesktop?: boolean;
  /** When false, budget slider is hidden (e.g. Define Criteria context). Default true. */
  showBudgetSlider?: boolean;
  /** Optional patch function for buyer preference extensions (physical, condition, utilities) */
  patchBuyerPreferenceExtensions?: (
    fn: (prev: BuyerPreferenceExtensions | undefined) => BuyerPreferenceExtensions
  ) => void;
};

export default function HousingSection({
  formData,
  isEditMode,
  updateFormData,
  isDesktop: _isDesktop,
  showBudgetSlider = true,
  patchBuyerPreferenceExtensions,
}: HousingSectionProps) {
  void _isDesktop;
  const showAgentOptionalBuyerCallout = useAgentOptionalBuyerCalloutVisibility(formData);
  return (
    <>
      <Title size="md" className="mb-2">
        {SECTION_TITLES.HOUSING_PREFERENCES}
      </Title>
      {showAgentOptionalBuyerCallout && (
        <ProfileSectionCallout>
          {AGENT_OPTIONAL_BUYER_SEARCH_PREFERENCES_HINT}
        </ProfileSectionCallout>
      )}

      <ProfileSectionBody>
        {showBudgetSlider && (
          <ProfileSectionGroup>
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
          </ProfileSectionGroup>
        )}

        <ProfileSectionGroup withDivider={showBudgetSlider}>
          <HousingPreferencesBody
            formData={formData}
            isEditMode={isEditMode}
            updateFormData={updateFormData}
            patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
          />
        </ProfileSectionGroup>
      </ProfileSectionBody>
    </>
  );
}
