import React, { useRef } from "react";

import { useLocalization } from "packages/contexts";
import { ChecklistStepSubmitFooter } from "packages/features/checklists/components/ChecklistStepSubmitFooter";
import type { ChecklistIntegrationComponentProps } from "packages/features/checklists/types/componentRegistry";
import { isDefineCriteriaStepComplete } from "packages/features/checklists/utils/integration/checklistIntegrationCompleteness";
import HousingSection from "packages/features/profile/components/sections/housing/HousingSection";
import { useResponsive } from "packages/hooks/ui";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import Card from "packages/ui/components/cards/Card";
import Box from "packages/ui/components/primitives/box/Box";

import PreferencesFormContent from "@/features/profile/components/settings/inputs/PreferencesFormContent.web";
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
        renderContent={({ formData, updateFormData, saveStatus }) => {
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
                wrapInCard={false}
                showBudgetSlider={false}
              />
              <ChecklistStepSubmitFooter
                disabled={!stepComplete}
                onSubmit={() => {
                  if (!isDefineCriteriaStepComplete(formSnapshotRef.current)) {
                    showWarningToast(
                      t("checklists.step.incomplete_warning", {
                        defaultValue:
                          "Complete all required fields in this step before submitting.",
                      })
                    );
                    return;
                  }
                  onComplete?.();
                }}
              />
            </Box>
          );
        }}
      />
    </Card>
  );
}
