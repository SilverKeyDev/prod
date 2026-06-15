import React from "react";

import { AccountLogoutAction } from "packages/features/homeauth/components/account/AccountLogoutAction";
import { convertStepsToNavItems } from "packages/features/profile/components/profilePicture/profileStepsUi";
import { ProfileFeatureSectionPanels } from "packages/features/profile/components/settings/inputs/ProfileFeatureSectionPanels";
import type { ProfileFeatureProps } from "packages/features/profile/components/settings/inputs/profileFeatureTypes";
import { useProfileFeatureShell } from "packages/features/profile/hooks";
import { Loading } from "packages/ui/components/media/asset/loading/Loading";
import { Box, Text } from "packages/ui/components/structure/primitives";
import SettingsSidebar from "packages/ui/components/structure/sidebar/SettingsSidebar";

export default function ProfileFeature(props: ProfileFeatureProps) {
  const shell = useProfileFeatureShell(props);

  if (shell.preferencesError) {
    return (
      <Box
        className={
          shell.agentSubject != null
            ? "flex flex-1 items-center justify-center p-6"
            : "bg-background-base flex min-h-screen items-center justify-center p-6"
        }
      >
        <Text className="text-text-secondary text-sm">{shell.preferencesError}</Text>
      </Box>
    );
  }

  if (shell.showPrefsLoading) {
    return (
      <Box
        className={
          shell.agentSubject != null
            ? "flex flex-1 items-center justify-center"
            : "bg-background-base flex min-h-screen items-center justify-center"
        }
      >
        <Loading message="Loading your preferences..." />
      </Box>
    );
  }

  const sectionPanels = (
    <ProfileFeatureSectionPanels
      agentSubject={shell.agentSubject}
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
      showAvailabilityEditor={shell.isAgentForProfileUi && shell.agentSubject == null}
    />
  );

  if (shell.agentSubject != null) {
    return <Box className="bg-background-base w-full min-w-0 flex-1">{sectionPanels}</Box>;
  }

  return (
    <Box className="bg-background-base min-h-screen">
      <Box className="mx-auto max-w-7xl pb-1 sm:px-6 lg:px-8">
        <Box className="flex flex-row gap-6 lg:gap-8">
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
          <Box className="min-w-0 flex-1">
            {sectionPanels}
            {shell.isMdDown ? <AccountLogoutAction variant="profile" placement="footer" /> : null}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
