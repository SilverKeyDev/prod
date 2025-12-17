import React, { useState, useEffect, useCallback, useRef } from "react";
import { Check } from "lucide-react";

import BaseModal from "./BaseModal";
import HousingSection from "../../features/onboardpersonalize/HousingSection";
import LocationSection from "../../features/onboardpersonalize/LocationSection";
import { parseUserPreferencesArrays } from "../../features/onboardpersonalize/lib/preferencesUtils";
import { useUserPreferences } from "../../../../packages/hooks/data/useUserData";
import { useGoogleMaps } from "../../../../packages/hooks/data/useGoogleMaps";
import { useAutoSavePreferences } from "../../../../packages/hooks/data/useAutoSavePreferences";
import useMobile from "../../../../packages/hooks/ui/useMobile";
import type { OnboardingData } from "../../features/onboardpersonalize/lib/types";

type PreferencesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesChanged?: () => void | Promise<void>;
};

const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  onPreferencesChanged,
}) => {
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const { isLoaded: googleMapsLoaded } = useGoogleMaps();
  const isDesktop = useMobile("(min-width: 768px)");
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const initialFormDataRef = useRef<Partial<OnboardingData>>({});
  const hasCapturedInitialStateRef = useRef(false);
  const scriptsReady =
    googleMapsLoaded &&
    typeof window !== "undefined" &&
    !!window.google?.maps?.places;

  // Use auto-save hook
  const { saveStatus, updateFormData: updateFormDataWithAutoSave } =
    useAutoSavePreferences({
      refreshUserPreferences,
      showErrorToastOnError: false, // PreferencesModal doesn't show error toast
    });

  // Initialize form data from user preferences
  useEffect(() => {
    if (userPreferences) {
      // Parse array fields using utility
      const arrayFields = parseUserPreferencesArrays(userPreferences, [
        "preferred_home_features",
        "deal_breakers",
        "important_locations",
      ]);

      // Helper function to safely extract string values
      const getString = (value: unknown): string | undefined => {
        return typeof value === "string" ? value : undefined;
      };

      // Helper function to safely extract number values
      const getNumber = (value: unknown): number | undefined => {
        return typeof value === "number" ? value : undefined;
      };

      const initialData: Partial<OnboardingData> = {
        preferred_housing_type: getString(
          userPreferences.preferred_housing_type
        ),
        preferred_bedrooms: getNumber(userPreferences.preferred_bedrooms),
        preferred_bathrooms: getNumber(userPreferences.preferred_bathrooms),
        preferred_lot_size: getString(userPreferences.preferred_lot_size),
        preferred_home_age: getString(userPreferences.preferred_home_age),
        preferred_architectural_style: getString(
          userPreferences.preferred_architectural_style
        ),
        renovation_preference: getString(userPreferences.renovation_preference),
        intended_property_use: getString(userPreferences.intended_property_use),
        walkability_importance: getString(
          userPreferences.walkability_importance
        ),
        ...(arrayFields as Partial<OnboardingData>),
      };

      setFormData(initialData);
    }
  }, [userPreferences]);

  // Track initial state when modal opens (after formData is populated)
  useEffect(() => {
    if (
      isOpen &&
      Object.keys(formData).length > 0 &&
      !hasCapturedInitialStateRef.current
    ) {
      // Capture initial state only once when modal opens
      initialFormDataRef.current = JSON.parse(JSON.stringify(formData));
      hasCapturedInitialStateRef.current = true;
    } else if (!isOpen) {
      // Reset tracking when modal closes
      initialFormDataRef.current = {};
      hasCapturedInitialStateRef.current = false;
    }
  }, [isOpen, formData]);

  // Wrapper for updateFormData that works with our hook
  const updateFormData = useCallback(
    (field: string | number | symbol, value: unknown) => {
      updateFormDataWithAutoSave(formData, setFormData, field, value);
    },
    [formData, updateFormDataWithAutoSave]
  );

  // Compare preferences when modal closes and trigger search if changed
  const handleClose = useCallback(async () => {
    // Deep compare current formData with initial state
    const currentDataStr = JSON.stringify(formData);
    const initialDataStr = JSON.stringify(initialFormDataRef.current);
    const hasChanged = currentDataStr !== initialDataStr;

    onClose();

    // If preferences changed, trigger search
    if (hasChanged && onPreferencesChanged) {
      await onPreferencesChanged();
    }
  }, [formData, onClose, onPreferencesChanged]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Preferences"
      size="xl"
      className="max-h-[90vh]"
    >
      <div className="space-y-6">
        {/* Save Status Indicator */}
        {saveStatus !== "idle" && (
          <div className="flex items-center gap-2 text-sm">
            {saveStatus === "saving" && (
              <span className="text-gray-600">Saving...</span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-green-600">
                <Check className="h-4 w-4" />
                Saved
              </span>
            )}
          </div>
        )}

        {/* Housing Preferences */}
        <HousingSection
          formData={formData}
          isEditMode={true}
          updateFormData={updateFormData}
          isDesktop={isDesktop}
        />

        {/* Location Preferences */}
        <LocationSection
          formData={formData}
          isEditMode={true}
          updateFormData={updateFormData}
          scriptsReady={scriptsReady}
        />
      </div>
    </BaseModal>
  );
};

export default PreferencesModal;
