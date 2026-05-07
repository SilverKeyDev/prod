import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useLocalization } from "packages/contexts";
import { ChecklistStepSubmitFooter } from "packages/features/checklists/components/ChecklistStepSubmitFooter";
import { isSetBudgetStepComplete } from "packages/features/checklists/utils/integration/checklistIntegrationCompleteness";
import { ProfileFinancialSection } from "packages/features/profile/components/profileScreen/sections/ProfileFinancialSection";
import type { OnboardingData } from "packages/features/profile/utils";
import { useAutoSavePreferences } from "packages/hooks/data/auth/useAutoSavePreferences";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { calculateAffordableHomePrice, type HomePriceResult } from "packages/utils/affordability";

import { userPreferencesToOnboardingData } from "@/features/profile/utils";

type SetBudgetSectionProps = {
  onComplete?: () => void;
};

export default function SetBudgetSection({ onComplete }: SetBudgetSectionProps) {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const { userPreferences, refreshUserPreferences } = useUserPreferences();

  const onAfterSave = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.search.all, "isochrone"],
    });
    // performSave in useAutoSavePreferences already refreshUserPreferences(); avoid a second
    // refetch that re-runs remote sync and can wipe in-progress field edits.
  }, [queryClient]);

  const { updateFormData: updateFormDataWithAutoSave, autoSave } = useAutoSavePreferences({
    refreshUserPreferences,
    showErrorToastOnError: true,
    successToastMessage: t("common.saved"),
    onAfterSave,
  });

  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [homePriceResult, setHomePriceResult] = useState<HomePriceResult | null>(null);
  const [homePriceLoading, setHomePriceLoading] = useState(false);
  const [homePriceError, setHomePriceError] = useState<string | null>(null);

  /** Match PreferencesFormContent: only hydrate from GET when preferences_version changes. */
  const appliedRemoteSyncKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userPreferences) return;
    const syncKey = `self:${String(userPreferences.preferences_version ?? "")}`;
    if (appliedRemoteSyncKeyRef.current === syncKey) {
      return;
    }
    appliedRemoteSyncKeyRef.current = syncKey;
    setFormData(userPreferencesToOnboardingData(userPreferences as Record<string, unknown>));
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
          "We couldn't calculate an estimate. Check your income and zip code and try again."
        );
        setHomePriceResult(null);
      } else {
        setHomePriceResult(result);
      }
    } catch (error: unknown) {
      setHomePriceError(
        error instanceof Error
          ? error.message
          : "We couldn't calculate an estimate. Check your income and zip code and try again."
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
    [formData, updateFormDataWithAutoSave]
  );

  const patchBuyerPreferenceExtensions = useCallback(
    (
      fn: (
        prev: OnboardingData["buyerPreferenceExtensions"]
      ) => NonNullable<OnboardingData["buyerPreferenceExtensions"]>
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
    [autoSave]
  );

  const stepComplete = useMemo(() => isSetBudgetStepComplete(formData), [formData]);

  const handleSubmitStep = useCallback(() => {
    if (!isSetBudgetStepComplete(formData)) {
      showWarningToast(
        t("checklists.step.incomplete_warning", {
          defaultValue: "Complete all required fields in this step before submitting.",
        })
      );
      return;
    }
    onComplete?.();
  }, [formData, onComplete, t]);

  return (
    <Card border="dotted" padding="md" className="mb-2">
      <Box className="gap-4">

        <ProfileFinancialSection
          formData={formData as OnboardingData}
          isEditMode={true}
          updateField={updateField}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
          homePriceResult={homePriceResult}
          homePriceLoading={homePriceLoading}
          homePriceError={homePriceError}
        />
        <ChecklistStepSubmitFooter disabled={!stepComplete} onSubmit={handleSubmitStep} />
      </Box>
    </Card>
  );
}
