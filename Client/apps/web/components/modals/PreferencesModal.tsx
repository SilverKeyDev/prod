import React, { useState, useEffect, useCallback, useRef } from "react";
import { Check } from "lucide-react";

import BaseModal from "./BaseModal";
import HousingSection, {
  getPreservedImportantLocations,
} from "../../features/onboardpersonalize/HousingSection";
import LocationSection from "../../features/onboardpersonalize/LocationSection";
import { parseUserPreferencesArrays } from "../../features/onboardpersonalize/lib/preferencesUtils";
import { useUserPreferences } from "../../../../packages/hooks/data/auth/useUserData";
import { useGoogleMaps } from "../../../../packages/hooks/data/useGoogleMaps";
import { useAutoSavePreferences } from "../../../../packages/hooks/data/auth/useAutoSavePreferences";
import { useResponsive } from "../../../../packages/hooks/ui";
import type { OnboardingData } from "../../features/onboardpersonalize/lib/types";
import { showErrorToast } from "../../../../packages/hooks/ui/useToast";

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
  const { isMdUp } = useResponsive();
  const isDesktop = isMdUp;
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const initialFormDataRef = useRef<Partial<OnboardingData>>({});
  const hasCapturedInitialStateRef = useRef(false);
  const [preventedDeleteWarning, setPreventedDeleteWarning] = useState(false);
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

        // If user tried to delete all locations and we preserved one,
        // remember to warn them when they close the modal.
        if (
          prevLocations.length > 0 &&
          nextLocations.length === 0 &&
          (preserved?.length ?? 0) > 0
        ) {
          setPreventedDeleteWarning(true);
        } else if ((preserved?.length ?? nextLocations.length) > 0) {
          // If they have at least one location again, clear the warning flag.
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
    [formData, updateFormDataWithAutoSave]
  );

  // Compare preferences when modal closes and trigger search if changed
  const handleClose = useCallback(async () => {
    if (preventedDeleteWarning) {
      showErrorToast(
        "You must have at least one important location. Your last location was kept and not deleted.",
      );
    }

    // Deep compare current formData with initial state
    const currentDataStr = JSON.stringify(formData);
    const initialDataStr = JSON.stringify(initialFormDataRef.current);
    const hasChanged = currentDataStr !== initialDataStr;

    onClose();

    // If preferences changed, trigger search
    if (hasChanged && onPreferencesChanged) {
      await onPreferencesChanged();
    }
  }, [formData, onClose, onPreferencesChanged, preventedDeleteWarning]);

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
