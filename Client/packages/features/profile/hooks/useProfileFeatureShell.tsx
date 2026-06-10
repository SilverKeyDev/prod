import { useCallback, useEffect, useMemo, useState } from "react";

import PersonalizationMobileHeader from "packages/features/profile/components/account/MobileHeader";
import type { ProfileFeatureProps } from "packages/features/profile/components/settings/inputs/profileFeatureTypes";
import { useGoogleMapsPlacesReady } from "packages/features/profile/hooks/useGoogleMapsPlacesReady";
import { usePersonalizationScrollActiveSection } from "packages/features/profile/hooks/usePersonalizationScrollActiveSection";
import { useProfileDocSignOAuthReturn } from "packages/features/profile/hooks/useProfileDocSignOAuthReturn";
import { useProfilePersonalizationModel } from "packages/features/profile/hooks/useProfilePersonalizationModel";
import { scrollToPersonalizationSection } from "packages/features/profile/utils/personalization/personalizationScrollActiveSection";
import { useResponsive } from "packages/hooks/ui";
import { useNavigation } from "packages/navigation/hooks/useNavigation";

const noopSetMobileHeaderActions = () => {};

export function useProfileFeatureShell({
  setMobileHeaderActions: setMobileHeaderActionsProp,
  agentSubject = null,
  validateFunction,
  skipValidation,
}: ProfileFeatureProps) {
  const setMobileHeaderActions = setMobileHeaderActionsProp ?? noopSetMobileHeaderActions;
  const navigation = useNavigation();
  useProfileDocSignOAuthReturn(navigation);

  const [isSaving, setIsSaving] = useState(false);
  const model = useProfilePersonalizationModel({
    agentSubject,
    setLoading: setIsSaving,
    validateFunction,
    skipValidation,
  });

  const {
    STEPS,
    formData,
    isEditMode,
    setIsEditMode,
    preferencesError,
    showPrefsLoading,
    refreshUserPreferences,
    isAgentForProfileUi,
    showAgentPublicProfileShare,
    agentPublicProfileUserId,
    agentPublicProfileDisplayName,
    updateField: updateFormData,
    patchBuyerPreferenceExtensions,
    handleCancel,
    handleSave: handleSaveChanges,
  } = model;

  const sectionIds = useMemo(() => STEPS.map((s) => s.id), [STEPS]);
  const [activeSection, setActiveSection] = useState(STEPS[0]?.id ?? "");
  const { scriptsReady, loadError } = useGoogleMapsPlacesReady();

  usePersonalizationScrollActiveSection(sectionIds, setActiveSection);

  useEffect(() => {
    return () => {
      setMobileHeaderActions(null);
    };
  }, [setMobileHeaderActions]);

  useEffect(() => {
    if (STEPS.length > 0 && !STEPS.some((s) => s.id === activeSection)) {
      setActiveSection(STEPS[0]?.id ?? "");
    }
  }, [STEPS, activeSection]);

  const { isMdDown } = useResponsive();
  const isMobile = isMdDown;
  const isUltraSmallScreen = isMdDown;

  useEffect(() => {
    if (agentSubject != null) {
      setMobileHeaderActions(null);
      return;
    }
    if (isMobile) {
      setMobileHeaderActions(
        <PersonalizationMobileHeader
          isEditMode={isEditMode}
          isSaving={isSaving}
          onEdit={() => setIsEditMode(true)}
          onCancel={handleCancel}
          onSave={handleSaveChanges}
        />
      );
    } else {
      setMobileHeaderActions(null);
    }
  }, [
    agentSubject,
    isMobile,
    isEditMode,
    isSaving,
    setMobileHeaderActions,
    handleCancel,
    handleSaveChanges,
    setIsEditMode,
  ]);

  const scrollToSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    scrollToPersonalizationSection(sectionId);
  }, []);

  return {
    agentSubject,
    isAgentForProfileUi,
    preferencesError,
    showPrefsLoading,
    refreshUserPreferences,
    STEPS,
    formData,
    isEditMode,
    isSaving,
    activeSection,
    scriptsReady,
    loadError,
    isUltraSmallScreen,
    isMdDown,
    showAgentPublicProfileShare,
    agentPublicProfileUserId,
    agentPublicProfileDisplayName,
    updateFormData,
    patchBuyerPreferenceExtensions,
    handleSaveChanges,
    handleCancel,
    scrollToSection,
    setIsEditMode,
  };
}
