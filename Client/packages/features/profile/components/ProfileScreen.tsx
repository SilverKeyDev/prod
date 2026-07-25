import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AccountLogoutAction } from "packages/features/homeauth/components/account/AccountLogoutAction";
import { buildProfileUnderlineTabItems } from "packages/features/profile/components/profileScreen/buildProfileUnderlineTabItems";
import { validateProfilePhotoFile } from "packages/features/profile/components/profileScreen/profilePhotoValidation";
import { ProfileScreenPhotoFileInput } from "packages/features/profile/components/profileScreen/ProfileScreenPhotoFileInput";
import { ProfileScreenPreferenceToolbar } from "packages/features/profile/components/profileScreen/ProfileScreenPreferenceToolbar";
import { ProfileSectionPanel } from "packages/features/profile/components/profileScreen/ProfileSectionPanel";
import { AgentPublicProfileShareRow } from "packages/features/profile/components/profileScreen/tabs/privacy/AgentPublicProfileShareRow";
import { useProfilePersonalizationModel } from "packages/features/profile/hooks/useProfilePersonalizationModel";
import { getProfileSectionCompletion } from "packages/features/profile/utils";
import { useProfilePictureUpload } from "packages/hooks/data/auth/useProfilePictureUpload";
import { showErrorToast } from "packages/hooks/ui";
import { log } from "packages/logger";
import { Box, Loading, ScrollView, Text } from "packages/ui/components/structure/primitives";
import { UnderlineTabs } from "packages/ui/components/structure/tabs";
import { isWeb } from "packages/utils/core/platform";

export type ProfileScreenProps = {
  /** When set, loads that user's preferences read-only (e.g. agent client hub). */
  agentSubject?: { userId: string; displayName: string } | null;
};

export function ProfileScreen({ agentSubject = null }: ProfileScreenProps) {
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    missingFields: string[];
    errors: string[];
  }>({ missingFields: [], errors: [] });
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("demographics");

  const {
    uploadProfilePicture,
    isUploading: isUploadingProfilePicture,
    error: profilePictureError,
  } = useProfilePictureUpload();

  const {
    userProfile,
    preferencesError,
    preferencesLoading,
    userPreferences,
    refreshUserPreferences,
    STEPS,
    formData,
    isEditMode,
    setIsEditMode,
    effectiveEditMode,
    isAgentForProfileUi,
    showAgentPublicProfileShare,
    agentPublicProfileUserId,
    agentPublicProfileDisplayName,
    updateField,
    patchBuyerPreferenceExtensions,
    handleCancel,
    handleSave,
  } = useProfilePersonalizationModel({
    agentSubject,
    setLoading,
    setValidationResult,
    setShowValidationWarning,
    onSaveSuccess: () => {
      void refreshUserPreferences();
    },
  });

  useEffect(() => {
    if (STEPS.length > 0 && !STEPS.some((s) => s.id === activeSection)) {
      setActiveSection(STEPS[0]?.id ?? "demographics");
    }
  }, [STEPS, activeSection]);

  const sectionCompletion = useMemo(() => getProfileSectionCompletion(formData), [formData]);
  const currentStep = useMemo(
    () => STEPS.find((s) => s.id === activeSection),
    [STEPS, activeSection]
  );

  const underlineTabItems = useMemo(
    () => buildProfileUnderlineTabItems(STEPS, sectionCompletion),
    [STEPS, sectionCompletion]
  );

  const handleChangeProfilePhoto = useCallback(() => {
    if (!isWeb) {
      showErrorToast("Change your profile photo from Settings.");
      return;
    }
    profilePhotoInputRef.current?.click();
  }, []);

  const handleProfilePhotoInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validationError = validateProfilePhotoFile(file);
      if (validationError) {
        showErrorToast(validationError);
        e.target.value = "";
        return;
      }

      try {
        await uploadProfilePicture(file);
      } catch {
        showErrorToast("Failed to upload profile picture. Please try again.");
      } finally {
        e.target.value = "";
      }
    },
    [uploadProfilePicture]
  );

  useEffect(() => {
    if (
      showValidationWarning &&
      (validationResult.missingFields.length > 0 || validationResult.errors.length > 0)
    ) {
      const message = [...validationResult.missingFields, ...validationResult.errors].join("\n");
      log.warn("ERRORS", "Profile validation issues", { message });
      setShowValidationWarning(false);
    }
  }, [showValidationWarning, validationResult]);

  const handleStartEdit = useCallback(() => {
    setIsEditMode(true);
  }, [setIsEditMode]);

  if (preferencesError) {
    return (
      <Box className="flex-1 items-center justify-center p-6">
        <Text className="text-text-secondary">{preferencesError}</Text>
      </Box>
    );
  }

  if (preferencesLoading && userPreferences === undefined) {
    return (
      <Box className="flex-1 items-center justify-center p-6">
        <Loading />
      </Box>
    );
  }

  return (
    <Box className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Box className="gap-4 px-4 pt-4">
          {showAgentPublicProfileShare ? (
            <AgentPublicProfileShareRow
              agentId={agentPublicProfileUserId}
              displayName={agentPublicProfileDisplayName}
              publicProfileSlug={formData.public_profile_slug}
            />
          ) : null}
          {agentSubject == null ? (
            <ProfileScreenPhotoFileInput
              inputRef={profilePhotoInputRef}
              onChange={handleProfilePhotoInputChange}
            />
          ) : null}
          {agentSubject == null ? (
            <ProfileScreenPreferenceToolbar
              isEditMode={isEditMode}
              loading={loading}
              onStartEdit={handleStartEdit}
              onCancel={handleCancel}
              onSave={handleSave}
            />
          ) : null}

          <UnderlineTabs
            items={underlineTabItems}
            activeId={activeSection}
            onChange={(id) => setActiveSection(id)}
            compact
            /* Seven equal-width tabs collapse to ~56pt on a phone, wrapping each label mid-word
               and overlapping its icon. Sizing tabs to their labels and scrolling the row keeps
               them legible; web keeps the equal-width layout it has room for. */
            scrollable={!isWeb}
            className="mb-4"
          />

          <ProfileSectionPanel
            currentStep={currentStep}
            activeSection={activeSection}
            showAvailabilityEditor={isAgentForProfileUi && agentSubject == null}
            effectiveEditMode={effectiveEditMode}
            formData={formData}
            agentSubject={agentSubject}
            userProfile={userProfile}
            updateField={updateField}
            patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
            onChangeProfilePhoto={handleChangeProfilePhoto}
            isUploadingProfilePicture={isUploadingProfilePicture}
            profilePictureError={profilePictureError}
          />
        </Box>
      </ScrollView>
      {agentSubject == null ? <AccountLogoutAction variant="profile" placement="footer" /> : null}
    </Box>
  );
}
