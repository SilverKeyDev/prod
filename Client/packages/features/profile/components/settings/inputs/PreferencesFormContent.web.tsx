import React, { useCallback, useEffect, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import {
  getPreservedImportantLocations,
  HousingSection,
  LocationSection,
} from "packages/features/profile/components/sections/index.web";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/buyerPreferenceExtensions";
import { useGoogleMaps } from "packages/hooks/data";
import { useAutoSavePreferences } from "packages/hooks/data/auth/useAutoSavePreferences";
import {
  useUserData,
  useUserPreferences,
} from "packages/hooks/data/auth/useUserData";
import { useResponsive } from "packages/hooks/ui";
import { Box } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

import type { OnboardingData } from "@/features/profile/utils";
import { userPreferencesToOnboardingData } from "@/features/profile/utils";

import PreferencesSaveStatusRow from "./PreferencesSaveStatusRow";

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
    updateFormData: (field: keyof OnboardingData, value: unknown) => void;
    saveStatus: "idle" | "saving" | "saved";
    patchBuyerPreferenceExtensions: (
      fn: (
        prev: BuyerPreferenceExtensions | undefined,
      ) => BuyerPreferenceExtensions,
    ) => void;
    scriptsReady: boolean;
  }) => React.ReactNode;
  /** When an agent views a client in search, load that user's preferences into the form. */
  preferencesSubjectUserId?: string | null;
};
export default function PreferencesFormContent({
  formContentRef,
  showErrorToastOnError = false,
  onInitialSnapshot,
  onPreferencesSaved,
  renderContent,
  preferencesSubjectUserId,
}: PreferencesFormContentProps): React.ReactElement {
  const hasReportedInitialRef = useRef(false);
  const { t } = useLocalization();
  const { userProfile } = useUserData();
  const { userPreferences, refreshUserPreferences } = useUserPreferences({
    preferencesSubjectUserId,
  });
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
  const { saveStatus, updateFormData: updateFormDataWithAutoSave } =
    useAutoSavePreferences({
      refreshUserPreferences,
      debounceMs: 3000,
      showErrorToastOnError,
      successToastMessage: t("common.saved"),
      onAfterSave: onPreferencesSaved,
    });
  useEffect(() => {
    hasReportedInitialRef.current = false;
  }, [preferencesSubjectUserId]);

  useEffect(() => {
    if (!userPreferences) return;
    const initialData = userPreferencesToOnboardingData(
      userPreferences as Record<string, unknown>,
      userProfile ?? undefined,
    );
    setFormData(initialData);
  }, [userPreferences, userProfile, preferencesSubjectUserId]);
  useEffect(() => {
    if (formContentRef) {
      formContentRef.current = {
        formData,
        preventedDeleteWarning,
      };
    }
  }, [formContentRef, formData, preventedDeleteWarning]);
  useEffect(() => {
    if (
      onInitialSnapshot &&
      !hasReportedInitialRef.current &&
      Object.keys(formData).length > 0
    ) {
      hasReportedInitialRef.current = true;
      onInitialSnapshot(formData);
    }
  }, [formData, onInitialSnapshot]);
  const updateFormData = useCallback(
    (field: keyof OnboardingData, value: unknown) => {
      if (field === "important_locations") {
        const prevLocations = Array.isArray(formData.important_locations)
          ? formData.important_locations
          : [];
        const nextLocations = Array.isArray(value)
          ? (value as typeof prevLocations)
          : [];
        const preserved = getPreservedImportantLocations(
          prevLocations,
          nextLocations,
        );
        if (
          prevLocations.length > 0 &&
          nextLocations.length === 0 &&
          (preserved?.length ?? 0) > 0
        ) {
          setPreventedDeleteWarning(true);
        } else if ((preserved?.length ?? nextLocations.length) > 0) {
          setPreventedDeleteWarning(false);
        }
        updateFormDataWithAutoSave(
          formData,
          setFormData,
          field,
          preserved ?? [],
        );
        return;
      }
      updateFormDataWithAutoSave(formData, setFormData, field, value);
    },
    [formData, updateFormDataWithAutoSave],
  );

  const patchBuyerPreferenceExtensions = useCallback(
    (
      fn: (
        prev: BuyerPreferenceExtensions | undefined,
      ) => BuyerPreferenceExtensions,
    ) => {
      const next = fn(formData.buyerPreferenceExtensions);
      updateFormDataWithAutoSave(
        formData,
        setFormData,
        "buyerPreferenceExtensions",
        next,
      );
    },
    [formData, updateFormDataWithAutoSave],
  );
  if (renderContent) {
    return (
      <Box>
        {renderContent({
          formData,
          updateFormData,
          saveStatus,
          patchBuyerPreferenceExtensions,
          scriptsReady,
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
