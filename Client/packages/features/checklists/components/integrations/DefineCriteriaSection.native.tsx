import React, { useCallback, useEffect, useState } from "react";

import { useLocalization } from "packages/contexts";
import { HousingStep } from "packages/features/homeauth/components/onboarding-mobile"; /* eslint-disable-line silverkey/no-cross-feature-internals -- Checklist DefineCriteria reuses HousingStep from onboarding; shared composition. */
import { useAutoSavePreferences } from "packages/hooks/data/auth/useAutoSavePreferences";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import Button from "packages/ui/components/button/Button";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";

import PreferencesSaveStatusRow from "@/features/profile/components/settings/inputs/PreferencesSaveStatusRow";
import type { OnboardingData } from "@/features/profile/utils";
import { userPreferencesToOnboardingData } from "@/features/profile/utils";

type DefineCriteriaSectionProps = {
  onComplete?: () => void;
};

export default function DefineCriteriaSection({
  onComplete,
}: DefineCriteriaSectionProps) {
  const { t } = useLocalization();
  const { userPreferences, refreshUserPreferences } = useUserPreferences();

  const [formData, setFormData] = useState<Partial<OnboardingData>>({});

  const {
    saveStatus,
    updateFormData: updateFormDataWithAutoSave,
    autoSave,
  } = useAutoSavePreferences({
    refreshUserPreferences,
    debounceMs: 3000,
    showErrorToastOnError: true,
    successToastMessage: t("common.saved"),
  });

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

  useEffect(() => {
    if (userPreferences) {
      const initialData = userPreferencesToOnboardingData(
        userPreferences as Record<string, unknown>,
      );
      setFormData(initialData);
    }
  }, [userPreferences]);

  const updateFormData = useCallback(
    (field: string | number | symbol, value: unknown) => {
      updateFormDataWithAutoSave(formData, setFormData, field, value);
    },
    [formData, updateFormDataWithAutoSave],
  );

  const handleDone = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  return (
    <Card border="dotted" padding="md" className="mb-2">
      <Box className="gap-4">
        <PreferencesSaveStatusRow
          saveStatus={saveStatus}
          savingLabel={t("common.saving")}
          savedLabel={t("common.saved")}
          className="flex flex-row items-center gap-2"
        />

        <HousingStep
          formData={formData as OnboardingData}
          updateFormData={updateFormData}
          patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
        />

        <Button variant="primary" size="md" onPress={handleDone}>
          Done
        </Button>
      </Box>
    </Card>
  );
}
