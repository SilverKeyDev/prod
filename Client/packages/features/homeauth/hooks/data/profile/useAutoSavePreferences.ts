import { useCallback, useEffect, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import { showErrorToast, showSuccessToast } from "packages/hooks/ui";
import { log } from "packages/logger";

import { preferencesApi } from "@/features/homeauth/api/preferences";
import { formDataToPreferencesPayload, type OnboardingData } from "@/features/profile/utils";

type SaveStatus = "idle" | "saving" | "saved";

type UseAutoSavePreferencesOptions = {
  refreshUserPreferences: () => Promise<void>;
  onError?: (error: unknown) => void;
  debounceMs?: number;
  showErrorToastOnError?: boolean;
  /** When true (default), show a success toast when save completes. */
  showSuccessToastOnSave?: boolean;
  /**
   * Success toast body. When omitted or whitespace-only, uses localized `common.saved` (same as inline “Saved” status).
   */
  successToastMessage?: string;
  /** Called after each successful save (e.g. to trigger search refresh) */
  onAfterSave?: () => void | Promise<void>;
};

type UseAutoSavePreferencesReturn = {
  saveStatus: SaveStatus;
  isSaving: boolean;
  autoSave: (data: Partial<OnboardingData>) => void;
  /** Drop debounced pending saves without persisting (e.g. before clear preferences). */
  cancelPendingSave: () => void;
  /**
   * Await any in-flight save, then persist `data` once (serialized with the auto-save chain).
   * Clears debounced pending saves. Use after Apply so search runs against server state.
   */
  flushSave: (data: Partial<OnboardingData>) => Promise<void>;
  updateFormData: <T extends Partial<OnboardingData>>(
    formData: T,
    setFormData: React.Dispatch<React.SetStateAction<T>>,
    field: string | number | symbol,
    value: unknown
  ) => void;
};

const SUCCESS_TOAST_THROTTLE_MS = 1800;

export function useAutoSavePreferences({
  refreshUserPreferences,
  onError,
  debounceMs = 0,
  showErrorToastOnError = true,
  showSuccessToastOnSave = true,
  successToastMessage = "",
  onAfterSave,
}: UseAutoSavePreferencesOptions): UseAutoSavePreferencesReturn {
  const { t } = useLocalization();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDebouncedRef = useRef<Partial<OnboardingData> | null>(null);
  const lastSuccessToastAtRef = useRef(0);
  /** Serialize saves so an older in-flight request cannot overwrite a newer one on the server. */
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  const performSave = useCallback(
    async (data: Partial<OnboardingData>) => {
      setSaveStatus("saving");
      setIsSaving(true);
      try {
        const payload = formDataToPreferencesPayload(data as OnboardingData);
        const formIl = data.important_locations;
        const payloadIl = payload.important_locations;
        log.info("PROFILE_PREFERENCES", "autoSave.performSave.payload", {
          formHasImportantLocationsKey: Object.prototype.hasOwnProperty.call(
            data,
            "important_locations"
          ),
          formImportantLocationsLen: Array.isArray(formIl) ? formIl.length : null,
          payloadHasImportantLocationsKey: Object.prototype.hasOwnProperty.call(
            payload,
            "important_locations"
          ),
          payloadImportantLocationsLen: Array.isArray(payloadIl) ? payloadIl.length : null,
        });
        const saveResponse = await preferencesApi.createOrUpdate(payload);
        const prefs = saveResponse.preferences as { important_locations?: unknown } | undefined;
        const savedIl = prefs?.important_locations;
        log.info("PROFILE_PREFERENCES", "autoSave.performSave.apiResponse", {
          responseSuccess:
            typeof (saveResponse as { success?: boolean }).success === "boolean"
              ? (saveResponse as { success: boolean }).success
              : null,
          responseImportantLocationsLen: Array.isArray(savedIl) ? savedIl.length : null,
        });
        setSaveStatus("saved");
        setIsSaving(false);

        if (showSuccessToastOnSave) {
          const now = Date.now();
          const shouldToast =
            debounceMs > 0 || now - lastSuccessToastAtRef.current >= SUCCESS_TOAST_THROTTLE_MS;
          if (shouldToast) {
            lastSuccessToastAtRef.current = now;
            showSuccessToast(successToastMessage.trim() ? successToastMessage : t("common.saved"));
          }
        }

        await refreshUserPreferences();

        void onAfterSave?.();

        setTimeout(() => {
          setSaveStatus((s) => (s === "saved" ? "idle" : s));
        }, 2000);
      } catch (error) {
        log.error("ERRORS", "Failed to save preferences", error);
        setSaveStatus("idle");
        setIsSaving(false);

        if (showErrorToastOnError) {
          showErrorToast("Failed to save preferences. Please try again.");
        }

        onError?.(error);
        throw error;
      }
    },
    [
      refreshUserPreferences,
      debounceMs,
      showErrorToastOnError,
      showSuccessToastOnSave,
      successToastMessage,
      t,
      onError,
      onAfterSave,
    ]
  );

  const autoSave = useCallback(
    (data: Partial<OnboardingData>) => {
      if (debounceMs <= 0) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        pendingDebouncedRef.current = null;
        saveChainRef.current = saveChainRef.current
          .catch(() => {
            /* keep the chain alive after a failed save */
          })
          .then(() => performSave(data))
          .catch(() => {
            /* errors surfaced via toast; swallow for queued auto-saves */
          });
        void saveChainRef.current;
        return;
      }

      pendingDebouncedRef.current = data;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        const toSave = pendingDebouncedRef.current;
        pendingDebouncedRef.current = null;
        if (toSave) {
          void performSave(toSave).catch(() => {
            /* errors surfaced via toast */
          });
        }
      }, debounceMs);
    },
    [debounceMs, performSave]
  );

  const cancelPendingSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    pendingDebouncedRef.current = null;
  }, []);

  const flushSave = useCallback(
    async (data: Partial<OnboardingData>) => {
      cancelPendingSave();
      saveChainRef.current = saveChainRef.current
        .catch(() => {
          /* keep the chain alive after a failed save */
        })
        .then(() => performSave(data));
      await saveChainRef.current;
    },
    [cancelPendingSave, performSave]
  );

  const updateFormData = useCallback(
    <T extends Partial<OnboardingData>>(
      _formData: T,
      setFormData: React.Dispatch<React.SetStateAction<T>>,
      field: string | number | symbol,
      value: unknown
    ) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value } as T;
        void autoSave(next);
        return next;
      });
    },
    [autoSave]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      const toSave = pendingDebouncedRef.current;
      pendingDebouncedRef.current = null;
      if (toSave && debounceMs > 0) {
        void performSave(toSave);
      }
    };
  }, [debounceMs, performSave]);

  return {
    saveStatus,
    isSaving,
    autoSave,
    cancelPendingSave,
    flushSave,
    updateFormData,
  };
}
