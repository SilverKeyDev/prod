import { useCallback, useEffect, useRef, useState } from "react";

import type {
  PreferencesFormActionsRef,
  PreferencesFormContentRef,
} from "packages/features/profile/components/settings/inputs/preferencesFormContentTypes";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import type { OnboardingData } from "packages/features/profile/utils";
import { userPreferencesToOnboardingData } from "packages/features/profile/utils";
import { useGoogleMaps } from "packages/hooks/data";
import { useAutoSavePreferences } from "packages/hooks/data/auth/useAutoSavePreferences";
import { useUserData, useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { log } from "packages/logger";
import { getWindow } from "packages/utils/core/platform";

export type UseEmbeddedPreferencesFormOptions = {
  formContentRef?: React.MutableRefObject<PreferencesFormContentRef | null>;
  showErrorToastOnError?: boolean;
  onInitialSnapshot?: (formData: Partial<OnboardingData>) => void;
  onPreferencesSaved?: () => void | Promise<void>;
  preferencesSubjectUserId?: string | null;
  preferencesFormActionsRef?: React.MutableRefObject<PreferencesFormActionsRef | null>;
  autoSaveDebounceMs?: number;
};

export function useEmbeddedPreferencesForm({
  formContentRef,
  showErrorToastOnError = false,
  onInitialSnapshot,
  onPreferencesSaved,
  preferencesSubjectUserId,
  preferencesFormActionsRef,
  autoSaveDebounceMs = 0,
}: UseEmbeddedPreferencesFormOptions = {}) {
  const hasReportedInitialRef = useRef(false);
  const appliedRemoteSyncKeyRef = useRef<string | null>(null);
  const { userProfile } = useUserData();
  const { userPreferences, refreshUserPreferences } = useUserPreferences({
    preferencesSubjectUserId,
  });
  const { isLoaded: googleMapsLoaded } = useGoogleMaps();
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const scriptsReady = (() => {
    const win = getWindow();
    return (
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
      ).google?.maps?.places
    );
  })();

  const {
    saveStatus,
    updateFormData: updateFormDataWithAutoSave,
    autoSave,
    cancelPendingSave,
    flushSave,
  } = useAutoSavePreferences({
    refreshUserPreferences,
    showErrorToastOnError,
    showSuccessToastOnSave: false,
    onAfterSave: onPreferencesSaved,
    debounceMs: autoSaveDebounceMs,
  });

  useEffect(() => {
    hasReportedInitialRef.current = false;
    appliedRemoteSyncKeyRef.current = null;
    setFormData({});
  }, [preferencesSubjectUserId]);

  useEffect(() => {
    if (!preferencesFormActionsRef) {
      return;
    }
    preferencesFormActionsRef.current = {
      replaceFormData: (next: Partial<OnboardingData>) => {
        setFormData(next);
        appliedRemoteSyncKeyRef.current = null;
      },
    };
    return () => {
      preferencesFormActionsRef.current = null;
    };
  }, [preferencesFormActionsRef]);

  useEffect(() => {
    if (!userPreferences) return;
    const subjectKey =
      preferencesSubjectUserId != null && preferencesSubjectUserId !== ""
        ? preferencesSubjectUserId
        : "self";
    const version = userPreferences.preferences_version ?? "";
    const syncKey = `${subjectKey}:${String(version)}`;
    const remoteIl = userPreferences.important_locations;
    const skipped = appliedRemoteSyncKeyRef.current === syncKey;
    log.info("PROFILE_PREFERENCES", "preferencesFormContent.remoteSync", {
      syncKey,
      skipped,
      remoteImportantLocationsLen: Array.isArray(remoteIl) ? remoteIl.length : null,
    });
    if (skipped) {
      return;
    }
    appliedRemoteSyncKeyRef.current = syncKey;
    const nextForm = userPreferencesToOnboardingData(
      userPreferences as Record<string, unknown>,
      userProfile ?? undefined
    );
    log.info("PROFILE_PREFERENCES", "preferencesFormContent.remoteSync.apply", {
      formImportantLocationsLen: Array.isArray(nextForm.important_locations)
        ? nextForm.important_locations.length
        : null,
    });
    setFormData(nextForm);
  }, [userPreferences, userProfile, preferencesSubjectUserId]);

  useEffect(() => {
    const nameFromProfile =
      userProfile != null && typeof userProfile.name === "string" && userProfile.name.trim() !== ""
        ? userProfile.name.trim()
        : undefined;
    if (!nameFromProfile) return;
    setFormData((prev) =>
      prev.name === nameFromProfile ? prev : { ...prev, name: nameFromProfile }
    );
  }, [userProfile]);

  useEffect(() => {
    if (formContentRef) {
      formContentRef.current = {
        formData,
      };
    }
  }, [formContentRef, formData]);

  useEffect(() => {
    if (onInitialSnapshot && !hasReportedInitialRef.current && Object.keys(formData).length > 0) {
      hasReportedInitialRef.current = true;
      onInitialSnapshot(formData);
    }
  }, [formData, onInitialSnapshot]);

  const updateFormData = useCallback(
    (field: keyof OnboardingData, value: unknown) => {
      if (field === "important_locations") {
        const nextLocations = Array.isArray(value)
          ? (value as NonNullable<OnboardingData["important_locations"]>)
          : [];
        log.info("PROFILE_PREFERENCES", "preferencesFormContent.updateImportantLocations", {
          nextLen: nextLocations.length,
        });
        updateFormDataWithAutoSave(formData, setFormData, field, nextLocations);
        return;
      }
      updateFormDataWithAutoSave(formData, setFormData, field, value);
    },
    [formData, updateFormDataWithAutoSave]
  );

  const patchBuyerPreferenceExtensions = useCallback(
    (fn: (prev: BuyerPreferenceExtensions | undefined) => BuyerPreferenceExtensions) => {
      setFormData((prev) => {
        const next = {
          ...prev,
          buyerPreferenceExtensions: fn(prev.buyerPreferenceExtensions),
        };
        autoSave(next);
        return next;
      });
    },
    [autoSave]
  );

  const flushPreferencesSave = useCallback(async () => {
    await flushSave(formDataRef.current);
  }, [flushSave]);

  return {
    formData,
    saveStatus,
    scriptsReady,
    updateFormData,
    patchBuyerPreferenceExtensions,
    flushPreferencesSave,
    cancelPendingSave,
  };
}
