import { useCallback, useEffect, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import { showErrorToast, showSuccessToast } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";

import { preferencesApi } from "@/features/homeauth/api/preferences";
import {
  formDataToPreferencesPayload,
  type OnboardingData,
} from "@/features/profile/utils";

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
  updateFormData: <T extends Partial<OnboardingData>>(
    formData: T,
    setFormData: React.Dispatch<React.SetStateAction<T>>,
    field: string | number | symbol,
    value: unknown,
  ) => void;
};

export function useAutoSavePreferences({
  refreshUserPreferences,
  onError,
  debounceMs = 1000,
  showErrorToastOnError = true,
  showSuccessToastOnSave = true,
  successToastMessage = "",
  onAfterSave,
}: UseAutoSavePreferencesOptions): UseAutoSavePreferencesReturn {
  const { t } = useLocalization();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const autoSave = useCallback(
    (data: Partial<OnboardingData>) => {
      // Clear existing timeout so we debounce from the last change
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce: only run save after debounceMs of no further changes
      saveTimeoutRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        setIsSaving(true);
        try {
          const payload = formDataToPreferencesPayload(data as OnboardingData);
          await preferencesApi.createOrUpdate(payload);
          setSaveStatus("saved");
          setIsSaving(false);

          if (showSuccessToastOnSave) {
            showSuccessToast(
              successToastMessage.trim()
                ? successToastMessage
                : t("common.saved"),
            );
          }

          // Refresh preferences to get updated data
          await refreshUserPreferences();

          void onAfterSave?.();

          // Clear saved status after 2 seconds
          setTimeout(() => {
            setSaveStatus("idle");
          }, 2000);
        } catch (error) {
          log.error(LOG_CATEGORIES.ERRORS, "Failed to save preferences", error);
          setSaveStatus("idle");
          setIsSaving(false);

          if (showErrorToastOnError) {
            showErrorToast("Failed to save preferences. Please try again.");
          }

          if (onError) {
            onError(error);
          }
        }
      }, debounceMs);
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
    ],
  );

  const updateFormData = useCallback(
    <T extends Partial<OnboardingData>>(
      _formData: T,
      setFormData: React.Dispatch<React.SetStateAction<T>>,
      field: string | number | symbol,
      value: unknown,
    ) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value } as T;
        void autoSave(next);
        return next;
      });
    },
    [autoSave],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    isSaving,
    autoSave,
    updateFormData,
  };
}
