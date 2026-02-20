import React, { useCallback, useEffect, useRef, useState } from "react";

import { Check } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { useAutoSavePreferences } from "packages/hooks/data/auth/useAutoSavePreferences";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useGoogleMaps } from "packages/hooks/data/useGoogleMaps";
import { useResponsive } from "packages/hooks/ui";
import type { OnboardingData } from "packages/utils/domain/profile";
import { parseUserPreferencesArrays } from "packages/utils/domain/profile";

import { BodyText } from "@/components/ui/index.web";

import {
  getPreservedImportantLocations,
  HousingSection,
  LocationSection,
} from "./sections/index.web";

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
  const scriptsReady =
    googleMapsLoaded &&
    typeof window !== "undefined" &&
    !!window.google?.maps?.places;

  const { saveStatus, updateFormData: updateFormDataWithAutoSave } =
    useAutoSavePreferences({
      refreshUserPreferences,
      showErrorToastOnError,
      onAfterSave: onPreferencesSaved,
    });

  useEffect(() => {
    if (userPreferences) {
      const arrayFields = parseUserPreferencesArrays(userPreferences, [
        "preferred_home_features",
        "deal_breakers",
        "important_locations",
        "why_joining_silverkey",
        "must_have",
        "listing_type",
      ]);
      const getString = (value: unknown): string | undefined =>
        typeof value === "string" ? value : undefined;
      const getNumber = (value: unknown): number | undefined =>
        typeof value === "number" ? value : undefined;
      const prefs = userPreferences as Record<string, unknown>;
      const initialData: Partial<OnboardingData> = {
        home_budget_min: getNumber(prefs.home_budget_min),
        home_budget_max: getNumber(prefs.home_budget_max),
        listing_status: getString(prefs.listing_status),
        preferred_housing_type: getString(
          userPreferences.preferred_housing_type,
        ),
        preferred_bedrooms: getNumber(userPreferences.preferred_bedrooms),
        preferred_bathrooms: getNumber(userPreferences.preferred_bathrooms),
        preferred_lot_size: getString(userPreferences.preferred_lot_size),
        preferred_home_age: getString(userPreferences.preferred_home_age),
        preferred_sqft_min: getNumber(prefs.preferred_sqft_min),
        preferred_sqft_max: getNumber(prefs.preferred_sqft_max),
        days_on_market_max: getNumber(prefs.days_on_market_max),
        preferred_lot_size_min: getNumber(prefs.preferred_lot_size_min),
        preferred_lot_size_max: getNumber(prefs.preferred_lot_size_max),
        preferred_home_age_max: getNumber(prefs.preferred_home_age_max),
        preferred_architectural_style: getString(
          userPreferences.preferred_architectural_style,
        ),
        renovation_preference: getString(userPreferences.renovation_preference),
        intended_property_use: getString(userPreferences.intended_property_use),
        walkability_importance: getString(
          userPreferences.walkability_importance,
        ),
        ...(arrayFields as Partial<OnboardingData>),
      };
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
    (field: string | number | symbol, value: unknown) => {
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

  if (renderContent) {
    return (
      <div className="space-y-6">
        {renderContent({
          formData,
          updateFormData,
          saveStatus,
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {saveStatus !== "idle" && (
        <div className="flex items-center gap-2 text-sm">
          {saveStatus === "saving" && (
            <BodyText as="span" size="sm" className="text-gray-600">
              {t("common.saving")}
            </BodyText>
          )}
          {saveStatus === "saved" && (
            <BodyText
              as="span"
              size="sm"
              className="flex items-center gap-1 text-green-600"
            >
              <Check className="h-4 w-4" />
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
