import React from "react";

import { useLocalization } from "packages/contexts";
import { HousingSection } from "packages/features/profile/components/sections/index.web"; /* eslint-disable-line silverkey/no-cross-feature-internals -- Checklist DefineCriteria reuses HousingSection from profile; shared composition. */
import { useResponsive } from "packages/hooks/ui";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";

import PreferencesFormContent from "@/features/profile/components/settings/inputs/PreferencesFormContent.web";
import PreferencesSaveStatusRow from "@/features/profile/components/settings/inputs/PreferencesSaveStatusRow";
import type { OnboardingData } from "@/features/profile/utils";

export default function DefineCriteriaSection() {
  const { t } = useLocalization();
  const { isMdUp } = useResponsive();
  const isDesktop = isMdUp;

  return (
    <Card border="dotted" padding="md" className="mb-2">
      <PreferencesFormContent
        showErrorToastOnError={true}
        renderContent={({ formData, updateFormData, saveStatus }) => (
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
          </Box>
        )}
      />
    </Card>
  );
}
