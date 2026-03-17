import React, { useCallback, useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useSearchHeaderLocations } from "packages/features/search/components/header/SearchHeaderLocations/useSearchHeaderLocations"; /* eslint-disable-line silverkey/no-cross-feature-internals -- Checklist embeds search location UI; shared composition. */
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations"; /* eslint-disable-line silverkey/no-cross-feature-internals -- Checklist embeds search location UI; shared composition. */
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useGoogleMaps } from "packages/hooks/data/useGoogleMaps";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { getWindow } from "packages/utils/platform";

import LocationSection from "@/features/profile/components/sections/LocationSection";
import type { OnboardingData } from "@/features/profile/utils";

type ChooseAreasSectionProps = {
  onComplete?: () => void;
};

export default function ChooseAreasSection({ onComplete: _onComplete }: ChooseAreasSectionProps) {
  const queryClient = useQueryClient();
  const { refreshUserPreferences } = useUserPreferences();

  const onPreferencesChanged = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.search.isochrone() });
    void refreshUserPreferences();
  }, [queryClient, refreshUserPreferences]);

  const { locations, localLocations, updateFormData, syncLocalFromPreferences } =
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

  useEffect(() => {
    syncLocalFromPreferences(Array.isArray(locations) ? locations : []);
  }, [locations, syncLocalFromPreferences]);

  const formData: Partial<OnboardingData> = {
    important_locations: localLocations,
  };

  if (!googleMapsLoaded) {
    return (
      <Card padding="md" className="mb-2">
        <BodyText size="sm" className="text-text-secondary">
          Loading map...
        </BodyText>
      </Card>
    );
  }

  return (
    <Card padding="md" className="mb-2">
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
      </Box>
    </Card>
  );
}
