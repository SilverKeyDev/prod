import { useCallback } from "react";

import { useShowPersonalizationSectionBodyTitle } from "packages/features/profile/components/layout";
import type { PatchBuyerPreferenceExtensions } from "packages/features/profile/components/profileScreen/searchPreferences/types";
import { withBuyerExtV1 } from "packages/features/profile/components/profileScreen/searchPreferences/withBuyerExtV1";
import { useAgentOptionalBuyerCalloutVisibility } from "packages/features/profile/hooks/useAgentOptionalBuyerCalloutVisibility";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import type { OnboardingData } from "packages/features/profile/utils";
import { PROFILE_NOT_SPECIFIED_LABEL } from "packages/features/profile/utils";
import type { HomePriceResult } from "packages/utils/affordability";

export type ProfileFinancialSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
  /** When provided, the affordability estimate block is shown (e.g. in checklist Set budget). */
  homePriceResult?: HomePriceResult | null;
  homePriceLoading?: boolean;
  homePriceError?: string | null;
};

export function useProfileFinancialSectionModel(
  props: Omit<ProfileFinancialSectionProps, "isEditMode" | "updateField">
): {
  showSectionTitle: boolean;
  showAgentOptionalBuyerCallout: boolean;
  showAffordabilityBlock: boolean;
  patch: (fn: (prev: BuyerPreferenceExtensions | undefined) => BuyerPreferenceExtensions) => void;
  budgetSummary: string;
  ext: ReturnType<typeof withBuyerExtV1>;
} {
  const {
    formData,
    patchBuyerPreferenceExtensions,
    homePriceResult,
    homePriceLoading,
    homePriceError,
  } = props;
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();
  const showAgentOptionalBuyerCallout = useAgentOptionalBuyerCalloutVisibility(formData.is_agent);
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

  return {
    showSectionTitle,
    showAgentOptionalBuyerCallout,
    showAffordabilityBlock,
    patch,
    budgetSummary,
    ext,
  };
}

export function getCreditScoreOptionLabel(
  options: readonly { value: string; label: string }[],
  value?: string
): string {
  if (!value) return PROFILE_NOT_SPECIFIED_LABEL;
  return options.find((opt) => opt.value === value)?.label ?? PROFILE_NOT_SPECIFIED_LABEL;
}
