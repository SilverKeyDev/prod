import React, { useCallback, useEffect, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import HousingSection from "packages/features/profile/components/sections/housing/HousingSection";
import LocationSection from "packages/features/profile/components/sections/LocationSection";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import { useGoogleMaps } from "packages/hooks/data";
import { useAutoSavePreferences } from "packages/hooks/data/auth/useAutoSavePreferences";
import { useUserData, useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useResponsive } from "packages/hooks/ui";
import { log } from "packages/logger";
import Box from "packages/ui/components/structure/primitives/box/Box";
import { getWindow } from "packages/utils/core/platform";

import type { OnboardingData } from "@/features/profile/utils";
import { userPreferencesToOnboardingData } from "@/features/profile/utils";

import PreferencesSaveStatusRow from "./PreferencesSaveStatusRow";

export type PreferencesFormContentRef = {
  formData: Partial<OnboardingData>;
};

/** Imperative actions for parents (e.g. search filters) to replace form state without field-by-field updates. */
export type PreferencesFormActionsRef = {
  replaceFormData: (next: Partial<OnboardingData>) => void;
};

type PreferencesFormContentProps = {
  /** Optional ref for parent to read current form state (e.g. on close for dirty check) */
  formContentRef?: React.MutableRefObject<PreferencesFormContentRef | null>;
  /** Optional; defaults to false. When true, showErrorToast is used for save errors */
  showErrorToastOnError?: boolean;
  /** Called once when form data is first populated (for parent to store initial snapshot) */
  onInitialSnapshot?: (formData: Partial<OnboardingData>) => void;
  /** Called after each successful auto-save (e.g. trigger search refresh) */
  onPreferencesSaved?: () => void | Promise<void>;
  /** When provided, renders this instead of the default HousingSection + LocationSection */
  renderContent?: (props: {
    formData: Partial<OnboardingData>;
    updateFormData: (field: keyof OnboardingData, value: unknown) => void;
    saveStatus: "idle" | "saving" | "saved";
    patchBuyerPreferenceExtensions: (
      fn: (prev: BuyerPreferenceExtensions | undefined) => BuyerPreferenceExtensions
    ) => void;
    scriptsReady: boolean;
    /** Persist current form to the server and await refresh (e.g. before preference-based search). */
    flushPreferencesSave: () => Promise<void>;
    /** Cancel debounced autosave without persisting (e.g. before clear preferences). */
    cancelPendingSave: () => void;
  }) => React.ReactNode;
  /**
   * When set, loads that user's preferences for display/editing in the form.
   * Saves still go to the authenticated user only (`POST /preferences`); agents cannot persist changes to the client's account.
   */
  preferencesSubjectUserId?: string | null;
  /** When set, parent can call `replaceFormData` to apply a full preferences snapshot (e.g. agent sync preview). */
  preferencesFormActionsRef?: React.MutableRefObject<PreferencesFormActionsRef | null>;
  /**
   * When > 0, debounces autosave (reduces saving/saved flicker in embedded contexts like checklists).
   * Default 0 matches settings/profile full-page behavior.
   */
  autoSaveDebounceMs?: number;
};
export default function PreferencesFormContent({
  formContentRef,
  showErrorToastOnError = false,
  onInitialSnapshot,
  onPreferencesSaved,
  renderContent,
  preferencesSubjectUserId,
  preferencesFormActionsRef,
  autoSaveDebounceMs = 0,
}: PreferencesFormContentProps): React.ReactElement {
  const hasReportedInitialRef = useRef(false);
  const appliedRemoteSyncKeyRef = useRef<string | null>(null);
  const { t } = useLocalization();
  const { userProfile } = useUserData();
  const { userPreferences, refreshUserPreferences } = useUserPreferences({
    preferencesSubjectUserId,
  });
  const { isLoaded: googleMapsLoaded } = useGoogleMaps();
  const { isMdUp } = useResponsive();
  const isDesktop = isMdUp;
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
    // Avoid showing the previous subject's preferences while the new GET is in flight.
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
    // Do not include profile name in syncKey: when the profile loads or name updates, a full reset
    // from GET preferences would race local edits (e.g. clearing important_locations) and restore
    // stale server data before the save+refetch completes.
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

  /** Keep form name in sync with auth profile without resetting the whole preferences form. */
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

  if (renderContent) {
    return (
      <Box>
        {renderContent({
          formData,
          updateFormData,
          saveStatus,
          patchBuyerPreferenceExtensions,
          scriptsReady,
          flushPreferencesSave,
          cancelPendingSave,
        })}
      </Box>
    );
  }

  return (
    <Box className="space-y-8">
      <HousingSection
        formData={formData as OnboardingData}
        isEditMode={true}
        updateFormData={updateFormData}
        isDesktop={isDesktop}
        patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
      />

      <LocationSection
        formData={formData as OnboardingData}
        isEditMode={true}
        updateFormData={updateFormData}
        scriptsReady={scriptsReady}
        patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
      />

      <PreferencesSaveStatusRow
        saveStatus={saveStatus}
        savingLabel={t("common.saving")}
        savedLabel={t("common.saved")}
        className="mt-4 flex items-center gap-2 text-sm"
      />
    </Box>
  );
}
