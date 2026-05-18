import React, { useRef } from "react";

import { useLocalization } from "packages/contexts";
import { ChecklistStepSubmitFooter } from "packages/features/checklists/components/steps/ChecklistStepSubmitFooter";
import type { ChecklistIntegrationComponentProps } from "packages/features/checklists/types/componentRegistry";
import { isDefineCriteriaStepComplete } from "packages/features/checklists/utils/integration/checklistIntegrationCompleteness";
import HousingSection from "packages/features/profile/components/sections/housing/HousingSection";
import PreferencesFormContent from "packages/features/profile/components/settings/inputs/PreferencesFormContent.web";
import { useResponsive } from "packages/hooks/ui";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import Card from "packages/ui/components/cards/Card";
import Box from "packages/ui/components/primitives/box/Box";

import PreferencesSaveStatusRow from "@/features/profile/components/settings/inputs/PreferencesSaveStatusRow";
import type { OnboardingData } from "@/features/profile/utils";

export default function DefineCriteriaSection({ onComplete }: ChecklistIntegrationComponentProps) {
  const { t } = useLocalization();
  const { isMdUp } = useResponsive();
  const isDesktop = isMdUp;
  const formSnapshotRef = useRef<Partial<OnboardingData>>({});

  return (
    <Card border="dotted" padding="md" className="mb-2">
      <PreferencesFormContent
        showErrorToastOnError={true}
        autoSaveDebounceMs={400}
        renderContent={({
          formData,
          updateFormData,
          saveStatus,
          patchBuyerPreferenceExtensions,
          flushPreferencesSave,
        }) => {
          formSnapshotRef.current = formData;
          const stepComplete = isDefineCriteriaStepComplete(formData);
          return (
            <Box className="gap-4">
              <PreferencesSaveStatusRow
                saveStatus={saveStatus}
                savingLabel={t("common.saving")}
                savedLabel={t("common.saved")}
                className="flex items-center gap-2 text-sm"
              />
              <HousingSection
                formData={formData as OnboardingData}
                isEditMode={true}
                updateFormData={updateFormData}
                isDesktop={isDesktop}
                showBudgetSlider={false}
                patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
              />
              <ChecklistStepSubmitFooter
                disabled={!stepComplete}
                onSubmit={() => {
                  void (async () => {
                    if (!isDefineCriteriaStepComplete(formSnapshotRef.current)) {
                      showWarningToast(
                        t("checklists.step.incomplete_warning", {
                          defaultValue:
                            "Complete all required fields in this step before submitting.",
                        })
                      );
                      return;
                    }
                    try {
                      await flushPreferencesSave();
                    } catch {
                      return;
                    }
                    if (isDefineCriteriaStepComplete(formSnapshotRef.current)) {
                      onComplete?.();
                    }
                  })();
                }}
              />
            </Box>
          );
        }}
      />
    </Card>
  );
}
