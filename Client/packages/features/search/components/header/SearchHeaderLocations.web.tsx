import React, { useCallback, useEffect } from "react";

import type { OnboardingData } from "packages/features/profile";
import { useSearchHeaderLocations } from "packages/features/search/hooks/ui/useSearchHeaderLocations";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { useGoogleMaps } from "packages/hooks/data";
import { getWindow } from "packages/utils/core/platform";

import { Popover } from "@/components/ui";
import LocationSection from "@/features/profile/components/sections/LocationSection";

import {
  SEARCH_HEADER_PANEL_CLASS_LOCATIONS,
  SEARCH_HEADER_PANEL_MAX_HEIGHT,
} from "./searchHeaderConstants";
import { SearchHeaderLocationsTrigger } from "./SearchHeaderLocations/SearchHeaderLocationsTrigger";

export { type SearchHeaderLocationsProps } from "./SearchHeaderLocations/types";

export default function SearchHeaderLocations({
  onPreferencesChanged,
}: {
  onPreferencesChanged?: () => void | Promise<void>;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const {
    locations,
    locationsList,
    hasLocations,
    localLocations,
    updateFormData,
    syncLocalFromPreferences,
    saveAndClose,
  } = useSearchHeaderLocations(onPreferencesChanged);

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
    if (open) {
      syncLocalFromPreferences(Array.isArray(locations) ? locations : []);
    }
  }, [open, locations, syncLocalFromPreferences]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setOpen(false);
        saveAndClose();
      } else {
        setOpen(true);
      }
    },
    [saveAndClose]
  );

  const formData: Partial<OnboardingData> = {
    important_locations: localLocations,
  };

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      usePortal={true}
      side="bottom"
      panelClassName={SEARCH_HEADER_PANEL_CLASS_LOCATIONS}
      panelMaxHeight={SEARCH_HEADER_PANEL_MAX_HEIGHT}
      panelMinWidth="320px"
      className="w-full min-w-0 flex-1"
      triggerWrapperClassName="flex min-w-0 w-full flex-1"
      trigger={({ onToggle, panelId }) => (
        <SearchHeaderLocationsTrigger
          locationsList={locationsList}
          hasLocations={hasLocations}
          onPress={onToggle}
          expanded={open}
          panelId={panelId}
        />
      )}
    >
      {({ panelId }) => (
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
          titleId={panelId ? `${panelId}-title` : undefined}
        />
      )}
    </Popover>
  );
}
