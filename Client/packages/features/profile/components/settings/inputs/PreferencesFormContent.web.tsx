import React, { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import {
  getPreservedImportantLocations,
  HousingSection,
  LocationSection,
} from "packages/features/profile/components/sections/index.web";
import { useAutoSavePreferences } from "packages/hooks/data/auth/useAutoSavePreferences";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useGoogleMaps } from "packages/hooks/data/useGoogleMaps";
import { useResponsive } from "packages/hooks/ui";
import { getWindow } from "packages/utils/platform";

import { BodyText } from "@/components/ui";
import type { OnboardingData } from "@/features/profile/utils";
import { userPreferencesToOnboardingData } from "@/features/profile/utils";
export type PreferencesFormContentRef = {
  formData: Partial<OnboardingData>;
  preventedDeleteWarning: boolean;
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
    updateFormData: (field: string | number | symbol, value: unknown) => void;
    saveStatus: "idle" | "saving" | "saved";
  }) => React.ReactNode;
};
export default function PreferencesFormContent({
  formContentRef,
  showErrorToastOnError = false,
  onInitialSnapshot,
  onPreferencesSaved,
  renderContent,
}: PreferencesFormContentProps): React.ReactElement {
  const hasReportedInitialRef = useRef(false);
  const { t } = useLocalization();
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const { isLoaded: googleMapsLoaded } = useGoogleMaps();
  const { isMdUp } = useResponsive();
  const isDesktop = isMdUp;
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [preventedDeleteWarning, setPreventedDeleteWarning] = useState(false);
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
  const { saveStatus, updateFormData: updateFormDataWithAutoSave } = useAutoSavePreferences({
    refreshUserPreferences,
    showErrorToastOnError,
    onAfterSave: onPreferencesSaved,
  });
  useEffect(() => {
    if (userPreferences) {
      const initialData = userPreferencesToOnboardingData(
        userPreferences as Record<string, unknown>
      );
      setFormData(initialData);
    }
  }, [userPreferences]);
  useEffect(() => {
    if (formContentRef) {
      formContentRef.current = {
        formData,
        preventedDeleteWarning,
      };
    }
  }, [formContentRef, formData, preventedDeleteWarning]);
  useEffect(() => {
    if (onInitialSnapshot && !hasReportedInitialRef.current && Object.keys(formData).length > 0) {
      hasReportedInitialRef.current = true;
      onInitialSnapshot(formData);
    }
  }, [formData, onInitialSnapshot]);
  const updateFormData = useCallback(
    (field: string | number | symbol, value: unknown) => {
      if (field === "important_locations") {
        const prevLocations = Array.isArray(formData.important_locations)
          ? formData.important_locations
          : [];
        const nextLocations = Array.isArray(value) ? (value as typeof prevLocations) : [];
        const preserved = getPreservedImportantLocations(prevLocations, nextLocations);
        if (
          prevLocations.length > 0 &&
          nextLocations.length === 0 &&
          (preserved?.length ?? 0) > 0
        ) {
          setPreventedDeleteWarning(true);
        } else if ((preserved?.length ?? nextLocations.length) > 0) {
          setPreventedDeleteWarning(false);
        }
        updateFormDataWithAutoSave(formData, setFormData, field, preserved ?? []);
        return;
      }
      updateFormDataWithAutoSave(formData, setFormData, field, value);
    },
    [formData, updateFormDataWithAutoSave]
  );
  if (renderContent) {
    return (
      <div>
        {renderContent({
          formData,
          updateFormData,
          saveStatus,
        })}
      </div>
    );
  }
  return (
    <div>
      {saveStatus !== "idle" && (
        <div className="flex items-center gap-2 text-sm">
          {saveStatus === "saving" && (
            <BodyText as="span" size="sm" className="text-text-secondary">
              {t("common.saving")}
            </BodyText>
          )}
          {saveStatus === "saved" && (
            <BodyText as="span" size="sm" className="text-accent flex items-center gap-1">
              <Icon name="check" className="h-4 w-4" />
              {t("common.saved")}
            </BodyText>
          )}
        </div>
      )}
      <HousingSection
        formData={formData as OnboardingData}
        isEditMode={true}
        updateFormData={updateFormData}
        isDesktop={isDesktop}
      />
      <LocationSection
        formData={formData as OnboardingData}
        isEditMode={true}
        updateFormData={updateFormData}
        scriptsReady={scriptsReady}
      />
    </div>
  );
}
