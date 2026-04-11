import React, { useCallback, useEffect, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useLocalization } from "packages/contexts";
import { ProfileFinancialSection } from "packages/features/profile/components/profileScreen/ProfileFinancialSection"; /* eslint-disable-line silverkey/no-cross-feature-internals -- Checklist embeds profile financial UI; shared composition. */
import type { OnboardingData } from "packages/features/profile/utils"; /* eslint-disable-line silverkey/no-cross-feature-internals -- Checklist embeds profile financial UI; shared composition. */
import { useAutoSavePreferences } from "packages/hooks/data/auth/useAutoSavePreferences";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import {
  calculateAffordableHomePrice,
  type HomePriceResult,
} from "packages/utils/affordability";

import { userPreferencesToOnboardingData } from "@/features/profile/utils";

type SetBudgetSectionProps = {
  onComplete?: () => void;
};

export default function SetBudgetSection({
  onComplete: _onComplete,
}: SetBudgetSectionProps) {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const { userPreferences, refreshUserPreferences } = useUserPreferences();

  const onAfterSave = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.search.all, "isochrone"],
    });
    void refreshUserPreferences();
  }, [queryClient, refreshUserPreferences]);

  const { updateFormData: updateFormDataWithAutoSave, autoSave } =
    useAutoSavePreferences({
      refreshUserPreferences,
      debounceMs: 3000,
      showErrorToastOnError: true,
      successToastMessage: t("common.saved"),
      onAfterSave,
    });

  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [homePriceResult, setHomePriceResult] =
    useState<HomePriceResult | null>(null);
  const [homePriceLoading, setHomePriceLoading] = useState(false);
  const [homePriceError, setHomePriceError] = useState<string | null>(null);
  const [isAffordabilityCollapsed, setIsAffordabilityCollapsed] =
    useState(false);

  useEffect(() => {
    if (userPreferences) {
      const initialData = userPreferencesToOnboardingData(
        userPreferences as Record<string, unknown>,
      );
      setFormData(initialData);
    }
  }, [userPreferences]);

  const calculateHomePrice = useCallback(() => {
    if (!formData.gross_income || !formData.ideal_zip_code) {
      setHomePriceResult(null);
      setHomePriceError(null);
      return;
    }

    try {
      setHomePriceLoading(true);
      setHomePriceError(null);

      const result = calculateAffordableHomePrice(formData as OnboardingData);

      if ("error" in result) {
        setHomePriceError(
          "We couldn't calculate an estimate. Check your income and zip code and try again.",
        );
        setHomePriceResult(null);
      } else {
        setHomePriceResult(result);
      }
    } catch (error: unknown) {
      setHomePriceError(
        error instanceof Error
          ? error.message
          : "We couldn't calculate an estimate. Check your income and zip code and try again.",
      );
      setHomePriceResult(null);
    } finally {
      setHomePriceLoading(false);
    }
  }, [formData]);

  useEffect(() => {
    if (formData.gross_income && formData.ideal_zip_code) {
      calculateHomePrice();
    } else {
      setHomePriceResult(null);
      setHomePriceError(null);
    }
  }, [
    formData.gross_income,
    formData.down_payment,
    formData.ideal_zip_code,
    formData.credit_score_range,
    calculateHomePrice,
  ]);

  const updateField = useCallback(
    (field: keyof OnboardingData, value: unknown) => {
      updateFormDataWithAutoSave(formData, setFormData, field, value);
    },
    [formData, updateFormDataWithAutoSave],
  );

  const patchBuyerPreferenceExtensions = useCallback(
    (
      fn: (
        prev: OnboardingData["buyerPreferenceExtensions"],
      ) => NonNullable<OnboardingData["buyerPreferenceExtensions"]>,
    ) => {
      setFormData((prev) => {
        const next = {
          ...prev,
          buyerPreferenceExtensions: fn(prev.buyerPreferenceExtensions),
        } as OnboardingData;
        autoSave(next);
        return next;
      });
    },
    [autoSave],
  );

  return (
    <Card border="dotted" padding="md" className="mb-2">
      <Box className="gap-4">
        <BodyText size="sm" className="text-text-secondary">
          Set your budget range, income, and down payment so search results
          match what you can afford. Your preferences are saved automatically.
        </BodyText>

        <ProfileFinancialSection
          formData={formData as OnboardingData}
          isEditMode={true}
          updateField={updateField}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
          homePriceResult={homePriceResult}
          homePriceLoading={homePriceLoading}
          homePriceError={homePriceError}
          isAffordabilityCollapsed={isAffordabilityCollapsed}
          setIsAffordabilityCollapsed={setIsAffordabilityCollapsed}
        />
      </Box>
    </Card>
  );
}
