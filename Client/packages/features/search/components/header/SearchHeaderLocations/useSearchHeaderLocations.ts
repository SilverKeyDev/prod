import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { showErrorToast, showSuccessToast } from "packages/hooks/ui/toast/useToast";
import { log, LOG_CATEGORIES } from "packages/logger";

import { LOCATION_SAVE_DEBOUNCE_MS } from "./constants";
import type { SearchImportantLocation } from "./types";

export function useSearchHeaderLocations(onPreferencesChanged?: () => void | Promise<void>) {
  const { t } = useLocalization();
  const [localLocations, setLocalLocations] = useState<SearchImportantLocation[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { userPreferences, updatePreferences } = useUserPreferences();

  const localLocationsRef = useRef(localLocations);
  const locationsListRef = useRef<SearchImportantLocation[]>([]);
  const updatePreferencesRef = useRef(updatePreferences);
  const onPreferencesChangedRef = useRef(onPreferencesChanged);
  localLocationsRef.current = localLocations;
  updatePreferencesRef.current = updatePreferences;
  onPreferencesChangedRef.current = onPreferencesChanged;

  const locations = userPreferences?.important_locations as
    | SearchImportantLocation[]
    | undefined
    | null;
  const locationsList = useMemo(() => (Array.isArray(locations) ? locations : []), [locations]);
  locationsListRef.current = locationsList;
  const hasLocations = locationsList.length > 0;

  const updateFormData = useCallback(
    (field: string | number | symbol, value: unknown) => {
      const next = Array.isArray(value) ? (value as SearchImportantLocation[]) : [];
      if (field === "important_locations") {
        log.info(LOG_CATEGORIES.PROFILE_PREFERENCES, "searchHeaderLocations.update", {
          nextLen: next.length,
        });
      }
      setLocalLocations(next);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        void updatePreferences({ important_locations: next })
          .then(() => {
            void onPreferencesChanged?.();
            showSuccessToast(t("common.saved"));
          })
          .catch(() => {
            showErrorToast("Could not save locations. Please try again.");
          });
      }, LOCATION_SAVE_DEBOUNCE_MS);
    },
    [updatePreferences, onPreferencesChanged, t]
  );

  const syncLocalFromPreferences = useCallback((prefs: SearchImportantLocation[]) => {
    setLocalLocations(Array.isArray(prefs) ? [...prefs] : []);
  }, []);

  const saveAndClose = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const toSave = localLocations ?? [];
    const hasChanged = JSON.stringify(toSave) !== JSON.stringify(locationsList);
    void updatePreferences({ important_locations: toSave })
      .then(() => {
        void onPreferencesChanged?.();
        if (hasChanged) {
          showSuccessToast(t("common.saved"));
        }
      })
      .catch(() => {
        showErrorToast("Could not save locations. Please try again.");
      });
  }, [localLocations, locationsList, updatePreferences, onPreferencesChanged, t]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        const toSave = localLocationsRef.current ?? [];
        void updatePreferencesRef
          .current({ important_locations: toSave })
          .then(() => void onPreferencesChangedRef.current?.())
          .catch(() => {
            showErrorToast("Could not save locations. Please try again.");
          });
      }
    };
  }, []);

  return {
    locations,
    locationsList,
    hasLocations,
    localLocations,
    setLocalLocations,
    updateFormData,
    syncLocalFromPreferences,
    saveAndClose,
  };
}
