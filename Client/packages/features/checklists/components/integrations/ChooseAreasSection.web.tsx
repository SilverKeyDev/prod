import React, { useCallback, useEffect, useMemo, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useLocalization } from "packages/contexts";
import { ChecklistStepSubmitFooter } from "packages/features/checklists/components/ChecklistStepSubmitFooter";
import { isChooseSearchAreaStepComplete } from "packages/features/checklists/utils/integration/checklistIntegrationCompleteness";
import type { SearchImportantLocation } from "packages/features/search/components/header/SearchHeaderLocations/types";
import { useSearchHeaderLocations } from "packages/features/search/components/header/SearchHeaderLocations/useSearchHeaderLocations";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { useGoogleMaps } from "packages/hooks/data";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { getWindow } from "packages/utils/platform";

import LocationSection from "@/features/profile/components/sections/LocationSection";
import type { OnboardingData } from "@/features/profile/utils";

type ChooseAreasSectionProps = {
  onComplete?: () => void;
};

export default function ChooseAreasSection({ onComplete }: ChooseAreasSectionProps) {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const { refreshUserPreferences, userPreferences } = useUserPreferences();

  const onPreferencesChanged = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.search.all, "isochrone"],
    });
    void refreshUserPreferences();
  }, [queryClient, refreshUserPreferences]);

  const { localLocations, updateFormData, syncLocalFromPreferences } =
    useSearchHeaderLocations(onPreferencesChanged);

  const { isLoaded: googleMapsLoaded } = useGoogleMaps();
  const win = getWindow();
  const scriptsReady =
    !!googleMapsLoaded &&
    !!win &&
    !!(
      win as unknown as {
        google?: { maps?: { places?: unknown } };
      }
    ).google?.maps?.places;

  const lastRemoteImportantLocationsSyncRef = useRef<{
    version: string;
    locationsSig: string;
  } | null>(null);

  useEffect(() => {
    if (!userPreferences) return;
    const version = String(userPreferences.preferences_version ?? "");
    const locs = Array.isArray(userPreferences.important_locations)
      ? userPreferences.important_locations
      : [];
    const locationsSig = JSON.stringify(locs);
    const prev = lastRemoteImportantLocationsSyncRef.current;
    if (prev !== null && prev.version === version && prev.locationsSig === locationsSig) {
      return;
    }
    lastRemoteImportantLocationsSyncRef.current = { version, locationsSig };
    syncLocalFromPreferences(locs as SearchImportantLocation[]);
  }, [userPreferences, syncLocalFromPreferences]);

  const formData = useMemo<Partial<OnboardingData>>(
    () => ({
      important_locations: localLocations,
    }),
    [localLocations]
  );

  const stepComplete = useMemo(() => isChooseSearchAreaStepComplete(formData), [formData]);

  const handleSubmitStep = useCallback(() => {
    if (!isChooseSearchAreaStepComplete(formData)) {
      showWarningToast(
        t("checklists.step.incomplete_warning", {
          defaultValue: "Complete all required fields in this step before submitting.",
        })
      );
      return;
    }
    onComplete?.();
  }, [formData, onComplete, t]);

  if (!googleMapsLoaded) {
    return (
      <Card border="dotted" padding="md" className="mb-2">
        <BodyText size="sm" className="text-text-secondary">
          Loading map...
        </BodyText>
      </Card>
    );
  }

  return (
    <Card border="dotted" padding="md" className="mb-2">
      <Box className="gap-4">
        <BodyText size="sm" className="text-text-secondary">
          Add work, family, or other important places. Set how far you&apos;re willing to commute
          from each. The map will show your search area (isochrones) based on these locations.
        </BodyText>

        <LocationSection
          formData={formData as OnboardingData}
          isEditMode={true}
          updateFormData={updateFormData}
          scriptsReady={scriptsReady}
          wrapInCard={false}
          addButtonLabel={
            SEARCH_TRANSLATIONS["search.add_work_school_location"] ??
            "Add work, school, or other location"
          }
        />
        <ChecklistStepSubmitFooter disabled={!stepComplete} onSubmit={handleSubmitStep} />
      </Box>
    </Card>
  );
}
