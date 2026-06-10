import React, { useEffect } from "react";

import { convertStepsToNavItems } from "packages/features/profile/components/profilePicture/profileStepsUi";
import { ProfileFeatureSectionPanels } from "packages/features/profile/components/settings/inputs/ProfileFeatureSectionPanels";
import { useProfileFeatureShell } from "packages/features/profile/hooks";
import { validateSettingsData } from "packages/features/profile/utils";
import { Loading } from "packages/ui/components/media/asset/loading/Loading";
import { Box, Text } from "packages/ui/components/structure/primitives";
import SettingsSidebar from "packages/ui/components/structure/sidebar/SettingsSidebar";
import { TwoColumnInsetPageLayout } from "packages/ui/components/structure/sidebar/TwoColumnInsetPageLayout";

export type PersonalizationSettingsScreenProps = {
  setMobileHeaderActions: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

export function PersonalizationSettingsScreen({
  setMobileHeaderActions,
}: PersonalizationSettingsScreenProps) {
  const shell = useProfileFeatureShell({
    setMobileHeaderActions,
    validateFunction: validateSettingsData,
  });

  const { refreshUserPreferences } = shell;

  useEffect(() => {
    void refreshUserPreferences();
  }, [refreshUserPreferences]);

  if (shell.preferencesError) {
    return (
      <Box className="bg-background-base flex min-h-screen items-center justify-center p-6">
        <Text className="text-text-secondary text-sm">{shell.preferencesError}</Text>
      </Box>
    );
  }

  if (shell.showPrefsLoading) {
    return (
      <Box className="bg-background-base flex min-h-screen items-center justify-center">
        <Loading message="Loading your preferences..." />
      </Box>
    );
  }

  return (
    <TwoColumnInsetPageLayout
      maxWidthClassName="max-w-7xl"
      regionClassName={`w-full flex-1 space-y-8 ${!shell.isUltraSmallScreen ? "lg:ml-0" : ""}`}
      sidebar={
        <SettingsSidebar
          items={convertStepsToNavItems(shell.STEPS)}
          activeSection={shell.activeSection}
          isEditMode={shell.isEditMode}
          isSaving={shell.isSaving}
          onEdit={() => shell.setIsEditMode(true)}
          onSave={shell.handleSaveChanges}
          onCancel={shell.handleCancel}
          onScrollToSection={shell.scrollToSection}
        />
      }
    >
      <ProfileFeatureSectionPanels
        agentSubject={null}
        isUltraSmallScreen={shell.isUltraSmallScreen}
        showAgentPublicProfileShare={shell.showAgentPublicProfileShare}
        agentPublicProfileUserId={shell.agentPublicProfileUserId}
        agentPublicProfileDisplayName={shell.agentPublicProfileDisplayName}
        agentPublicProfileSlug={shell.formData.public_profile_slug}
        steps={shell.STEPS}
        formData={shell.formData}
        isEditMode={shell.isEditMode}
        updateFormData={shell.updateFormData}
        patchBuyerPreferenceExtensions={shell.patchBuyerPreferenceExtensions}
        scriptsReady={shell.scriptsReady}
        loadError={shell.loadError}
        showAvailabilityEditor={shell.isAgentForProfileUi}
      />
    </TwoColumnInsetPageLayout>
  );
}
