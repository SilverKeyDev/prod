import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import { ChecklistStepSubmitFooter } from "packages/features/checklists/components/steps/ChecklistStepSubmitFooter";
import { isDefineCriteriaStepComplete } from "packages/features/checklists/utils/integration/checklistIntegrationCompleteness";
import { HousingStep } from "packages/features/profile/components/onboarding";
import { useAutoSavePreferences } from "packages/hooks/data/auth/useAutoSavePreferences";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";

import PreferencesSaveStatusRow from "@/features/profile/components/settings/inputs/PreferencesSaveStatusRow";
import type { OnboardingData } from "@/features/profile/utils";
import { userPreferencesToOnboardingData } from "@/features/profile/utils";

type DefineCriteriaSectionProps = {
  onComplete?: () => void;
};

export default function DefineCriteriaSection({ onComplete }: DefineCriteriaSectionProps) {
  const { t } = useLocalization();
  const { userPreferences, refreshUserPreferences } = useUserPreferences();

  const [formData, setFormData] = useState<Partial<OnboardingData>>({});

  const {
    saveStatus,
    updateFormData: updateFormDataWithAutoSave,
    autoSave,
    flushSave,
  } = useAutoSavePreferences({
    refreshUserPreferences,
    showErrorToastOnError: true,
    showSuccessToastOnSave: false,
    debounceMs: 400,
  });

  const appliedRemoteSyncKeyRef = useRef<string | null>(null);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

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

  useEffect(() => {
    if (!userPreferences) return;
    const syncKey = `self:${String(userPreferences.preferences_version ?? "")}`;
    if (appliedRemoteSyncKeyRef.current === syncKey) {
      return;
    }
    appliedRemoteSyncKeyRef.current = syncKey;
    setFormData(userPreferencesToOnboardingData(userPreferences as Record<string, unknown>));
  }, [userPreferences]);

  const updateFormData = useCallback(
    (field: string | number | symbol, value: unknown) => {
      updateFormDataWithAutoSave(formData, setFormData, field, value);
    },
    [formData, updateFormDataWithAutoSave]
  );

  const stepComplete = useMemo(() => isDefineCriteriaStepComplete(formData), [formData]);

  const handleSubmit = useCallback(() => {
    void (async () => {
      if (!isDefineCriteriaStepComplete(formDataRef.current)) {
        showWarningToast(
          t("checklists.step.incomplete_warning", {
            defaultValue: "Complete all required fields in this step before submitting.",
          })
        );
        return;
      }
      try {
        await flushSave(formDataRef.current);
      } catch {
        return;
      }
      onComplete?.();
    })();
  }, [flushSave, onComplete, t]);

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

        <ChecklistStepSubmitFooter disabled={!stepComplete} onSubmit={handleSubmit} />
      </Box>
    </Card>
  );
}
