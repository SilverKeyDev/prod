import React, { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useGoogleMaps } from "packages/hooks/data/useGoogleMaps";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";
import { getWindow } from "packages/utils/platform";

import { BodyText, Button, Popover } from "@/components/ui";
import LocationSection from "@/features/profile/components/sections/LocationSection";
import type { OnboardingData } from "@/features/profile/utils";

import {
  SEARCH_HEADER_PANEL_CLASS_LOCATIONS,
  SEARCH_HEADER_PANEL_MAX_HEIGHT,
} from "./searchHeaderConstants";

const MAX_VISIBLE = 3;
const ADDRESS_MAX_LENGTH = 28;
const LOCATION_SAVE_DEBOUNCE_MS = 400;
function truncateAddress(address: string): string {
  if (address.length <= ADDRESS_MAX_LENGTH) return address;
  return `${address.slice(0, ADDRESS_MAX_LENGTH - 3)}...`;
}
type SearchHeaderLocationsProps = {
  /** Called after locations are saved (e.g. refresh isochrone) */
  onPreferencesChanged?: () => void | Promise<void>;
};
export default function SearchHeaderLocations({
  onPreferencesChanged,
}: SearchHeaderLocationsProps): React.ReactElement {
  const { t } = useLocalization();
  const [open, setOpen] = useState(false);
  const [localLocations, setLocalLocations] = useState<OnboardingData["important_locations"]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { userPreferences, updatePreferences } = useUserPreferences();
  const { isLoaded: googleMapsLoaded } = useGoogleMaps();
  const win = getWindow();
  const scriptsReady =
    !!googleMapsLoaded &&
    !!win &&
    !!(
      win as unknown as {
        google?: {
          maps?: {
            places?: unknown;
          };
        };
      }
    ).google?.maps?.places;
  const locations = userPreferences?.important_locations;
  const locationsList = Array.isArray(locations) ? locations : [];
  const hasLocations = locationsList.length > 0;
  // Sync local state when popover opens
  useEffect(() => {
    if (open) {
      setLocalLocations(Array.isArray(locations) ? [...locations] : []);
    }
  }, [open, locations]);
  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);
  const formData: Partial<OnboardingData> = {
    important_locations: localLocations,
  };
  const updateFormData = useCallback(
    (field: string | number | symbol, value: unknown) => {
      if (field === "important_locations") {
        const next = Array.isArray(value) ? value : [];
        setLocalLocations(next);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          saveTimeoutRef.current = null;
          void updatePreferences({ important_locations: next })
            .then(() => onPreferencesChanged?.())
            .catch(() => {
              showErrorToast("Could not save locations. Please try again.");
            });
        }, LOCATION_SAVE_DEBOUNCE_MS);
      }
    },
    [updatePreferences, onPreferencesChanged]
  );
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setOpen(false);
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        const toSave = localLocations ?? [];
        void updatePreferences({ important_locations: toSave })
          .then(() => onPreferencesChanged?.())
          .catch(() => {
            showErrorToast("Could not save locations. Please try again.");
          });
      } else {
        setOpen(true);
      }
    },
    [localLocations, updatePreferences, onPreferencesChanged]
  );
  const locationTriggerClass = `box-border flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white/70 px-3 text-left transition-colors hover:border-olive hover:bg-white/90 touch-friendly ${HEADER_ROW_HEIGHT}`;
  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      usePortal={true}
      side="left"
      panelClassName={SEARCH_HEADER_PANEL_CLASS_LOCATIONS}
      panelMaxHeight={SEARCH_HEADER_PANEL_MAX_HEIGHT}
      panelMinWidth="320px"
      className="w-full min-w-0 flex-1"
      triggerWrapperClassName="flex min-w-0 w-full flex-1"
      trigger={({ onToggle }) =>
        hasLocations ? (
          <Button
            type="button"
            onClick={onToggle}
            variant="secondary"
            size="sm"
            className={locationTriggerClass}
            label="Edit locations"
          >
            <div className="scrollbar-hide flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
              <Icon name="map-pin" className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                {locationsList.slice(0, MAX_VISIBLE).map((loc, i) => (
                  <BodyText
                    key={`${loc.address}-${loc.commute_tolerance ?? ""}-${i}`}
                    as="span"
                    size="xs"
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5"
                  >
                    <BodyText size="xs" className="truncate text-gray-700" as="span">
                      {truncateAddress(loc.address)}
                    </BodyText>
                    {loc.commute_tolerance != null && (
                      <BodyText size="xs" muted as="span">
                        {t("search.commute_min", {
                          minutes: loc.commute_tolerance,
                        })}
                      </BodyText>
                    )}
                  </BodyText>
                ))}
                {locationsList.length > MAX_VISIBLE && (
                  <BodyText size="xs" muted className="shrink-0">
                    {t("search.locations_more", {
                      count: locationsList.length - MAX_VISIBLE,
                    })}
                  </BodyText>
                )}
              </div>
            </div>
            <Icon name="pencil" className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onToggle}
            variant="outline"
            size="sm"
            className={`hover:border-olive hover:bg-olive/5 hover:text-olive touch-friendly box-border inline-flex min-w-0 flex-1 items-center justify-start gap-2 border-2 border-dashed border-gray-300 bg-white/70 px-3 text-left text-gray-600 transition-colors ${HEADER_ROW_HEIGHT}`}
            label={t("search.add_location")}
            iconName="map-pin"
          >
            <BodyText as="span" size="sm" className="text-inherit">
              {t("search.add_location")}
            </BodyText>
          </Button>
        )
      }
    >
      {() => (
        <LocationSection
          formData={formData as OnboardingData}
          isEditMode={true}
          updateFormData={updateFormData}
          scriptsReady={scriptsReady}
          cardClassName="bg-transparent border-2 border-dashed border-gray-300 shadow-none"
        />
      )}
    </Popover>
  );
}
