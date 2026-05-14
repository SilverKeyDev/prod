import React, { useCallback, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useLocalization } from "packages/contexts";
import { ChecklistStepSubmitFooter } from "packages/features/checklists/components/steps/ChecklistStepSubmitFooter";
import { isChooseSearchAreaStepComplete } from "packages/features/checklists/utils/integration/checklistIntegrationCompleteness";
import LocationSection from "packages/features/profile/components/sections/LocationSection";
import PreferencesFormContent from "packages/features/profile/components/settings/inputs/PreferencesFormContent.web";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { useGoogleMaps } from "packages/hooks/data";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import type { OnboardingData } from "@/features/profile/utils";

type ChooseAreasSectionProps = {
  onComplete?: () => void;
};

export default function ChooseAreasSection({ onComplete }: ChooseAreasSectionProps) {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const formSnapshotRef = useRef<Partial<OnboardingData>>({});

  const onPreferencesSaved = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.search.all, "isochrone"],
    });
  }, [queryClient]);

  const { isLoaded: googleMapsLoaded } = useGoogleMaps();

  if (!googleMapsLoaded) {
    return (
      <Card border="dotted" padding="md" className="mb-2">
        <Box className="gap-4">
          <BodyText size="sm" className="text-text-secondary">
            Loading map...
          </BodyText>
          <ChecklistStepSubmitFooter disabled onSubmit={() => {}} />
        </Box>
      </Card>
    );
  }

  return (
    <Card border="dotted" padding="md" className="mb-2">
      <PreferencesFormContent
        showErrorToastOnError={true}
        autoSaveDebounceMs={400}
        onPreferencesSaved={onPreferencesSaved}
        renderContent={({
          formData,
          updateFormData,
          patchBuyerPreferenceExtensions,
          scriptsReady: mapsScriptsReady,
          flushPreferencesSave,
        }) => {
          formSnapshotRef.current = formData;
          const stepComplete = isChooseSearchAreaStepComplete(formData);
          return (
            <Box className="gap-4">
              <BodyText size="sm" className="text-text-secondary">
                Add work, family, or other important places. Set how far you&apos;re willing to
                commute from each. The map will show your search area (isochrones) based on these
                locations.
              </BodyText>

              <LocationSection
                formData={formData as OnboardingData}
                isEditMode={true}
                updateFormData={updateFormData}
                scriptsReady={mapsScriptsReady}
                patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
                addButtonLabel={
                  SEARCH_TRANSLATIONS["search.add_work_school_location"] ??
                  "Add work, school, or other location"
                }
              />
              <ChecklistStepSubmitFooter
                disabled={!stepComplete}
                onSubmit={() => {
                  void (async () => {
                    if (!isChooseSearchAreaStepComplete(formSnapshotRef.current)) {
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
                    onComplete?.();
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
