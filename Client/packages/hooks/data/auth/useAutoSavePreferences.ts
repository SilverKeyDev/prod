import { useCallback, useEffect, useRef, useState } from "react";
import { preferencesApi } from "../../../config/api";
import { showErrorToast } from "../../ui/useToast";
import type { OnboardingData } from "../../../../apps/web/features/onboardpersonalize/lib/types";

type SaveStatus = "idle" | "saving" | "saved";

type UseAutoSavePreferencesOptions = {
  refreshUserPreferences: () => Promise<void>;
  onError?: (error: unknown) => void;
  debounceMs?: number;
  showErrorToastOnError?: boolean;
};

type UseAutoSavePreferencesReturn = {
  saveStatus: SaveStatus;
  isSaving: boolean;
  autoSave: (data: Partial<OnboardingData>) => Promise<void>;
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
}: UseAutoSavePreferencesOptions): UseAutoSavePreferencesReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const autoSave = useCallback(
    async (data: Partial<OnboardingData>) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set saving status
      setSaveStatus("saving");
      setIsSaving(true);

      // Debounce save
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await preferencesApi.createOrUpdate(data);
          setSaveStatus("saved");
          setIsSaving(false);

          // Refresh preferences to get updated data
          await refreshUserPreferences();

          // Clear saved status after 2 seconds
          setTimeout(() => {
            setSaveStatus("idle");
          }, 2000);
        } catch (error) {
          console.error("Failed to save preferences:", error);
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
    [refreshUserPreferences, debounceMs, showErrorToastOnError, onError],
  );

  const updateFormData = useCallback(
    <T extends Partial<OnboardingData>>(
      formData: T,
      setFormData: React.Dispatch<React.SetStateAction<T>>,
      field: string | number | symbol,
      value: unknown,
    ) => {
      const updatedData = { ...formData, [field]: value };
      setFormData(updatedData);
      void autoSave(updatedData);
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
