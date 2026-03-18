import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import { getPersonalizationStepsUi } from "packages/features/profile/components/profilePicture/profileStepsUi";
import { ProfileCommunicationSection } from "packages/features/profile/components/profileScreen/ProfileCommunicationSection";
import { ProfileDemographicsSection } from "packages/features/profile/components/profileScreen/ProfileDemographicsSection";
import { ProfileFinancialSection } from "packages/features/profile/components/profileScreen/ProfileFinancialSection";
import { ProfileHousingSection } from "packages/features/profile/components/profileScreen/ProfileHousingSection";
import { ProfileLocationSection } from "packages/features/profile/components/profileScreen/ProfileLocationSection";
import type { OnboardingData } from "packages/features/profile/utils";
import {
  getProfileSectionCompletion,
  handleSubmit as handleSubmitUtil,
  userPreferencesToOnboardingData,
  validateSettingsData,
} from "packages/features/profile/utils";
import { usePreferencesSubmit } from "packages/hooks/data/auth/usePreferencesSubmit";
import { useProfilePictureUpload } from "packages/hooks/data/auth/useProfilePictureUpload";
import { useUserData, useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { showErrorToast } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import { ScrollView } from "packages/ui/components/primitives";
import { Loading } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { UnderlineTabs } from "packages/ui/components/tabs";

export function ProfileScreen() {
  const { t } = useLocalization();
  const { userProfile } = useUserData();
  const { userPreferences, preferencesLoading, preferencesError, refreshUserPreferences } =
    useUserPreferences();
  const submitPreferences = usePreferencesSubmit();
  const {
    uploadProfilePicture: _uploadProfilePicture,
    isUploading: isUploadingProfilePicture,
    error: profilePictureError,
  } = useProfilePictureUpload();

  const [formData, setFormData] = useState<OnboardingData>({});
  const [originalData, setOriginalData] = useState<OnboardingData>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    missingFields: string[];
    errors: string[];
  }>({ missingFields: [], errors: [] });
  const [showValidationWarning, setShowValidationWarning] = useState(false);

  const STEPS = getPersonalizationStepsUi();
  const [activeSection, setActiveSection] = useState<string>(STEPS[0]?.id ?? "demographics");

  const sectionCompletion = useMemo(() => getProfileSectionCompletion(formData), [formData]);

  const handleChangeProfilePhoto = useCallback(async () => {
    // Platform-specific photo upload handled by useProfilePictureUpload hook
    // This is a placeholder - actual implementation depends on platform
    try {
      // On web: would use input[type="file"]
      // On native: would use expo-document-picker
      log.warn(LOG_CATEGORIES.ERRORS, "Profile picture upload not implemented for this platform");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload profile picture. Please try again.";
      showErrorToast(message);
    }
  }, []);

  useEffect(() => {
    if (
      showValidationWarning &&
      (validationResult.missingFields.length > 0 || validationResult.errors.length > 0)
    ) {
      const message = [...validationResult.missingFields, ...validationResult.errors].join("\n");
      // Platform-specific alert - web would use a modal, native uses Alert
      log.warn(LOG_CATEGORIES.ERRORS, "Profile validation issues", { message });
      setShowValidationWarning(false);
    }
  }, [showValidationWarning, validationResult]);

  useEffect(() => {
    void refreshUserPreferences();
  }, [refreshUserPreferences]);

  useEffect(() => {
    if (userPreferences) {
      const data = userPreferencesToOnboardingData(
        userPreferences as Record<string, unknown>,
        userProfile ?? undefined
      );
      setFormData(data);
      setOriginalData(data);
    }
  }, [userPreferences, userProfile]);

  const updateField = useCallback((field: keyof OnboardingData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleStartEdit = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const handleCancel = useCallback(() => {
    setFormData(originalData);
    setIsEditMode(false);
  }, [originalData]);

  const handleSave = useCallback(async () => {
    const currentVersion = formData.preferences_version ?? "1.0";
    const versionParts = currentVersion.split(".");
    const majorVersion = parseInt(versionParts[0] ?? "1", 10) || 1;
    const minorVersion = parseInt(versionParts[1] ?? "0", 10) || 0;
    const newVersion = `${majorVersion}.${minorVersion + 1}`;

    const dataToSave: OnboardingData = {
      ...formData,
      preferences_version: newVersion,
    };

    await handleSubmitUtil({
      formData: dataToSave,
      submitPreferences,
      setLoading,
      setValidationResult,
      setShowValidationWarning,
      validateFunction: validateSettingsData,
      onSuccess: () => {
        setFormData(dataToSave);
        setOriginalData(dataToSave);
        setIsEditMode(false);
        void refreshUserPreferences();
      },
      onShowError: showErrorToast,
    });
  }, [formData, submitPreferences, refreshUserPreferences]);

  if (preferencesLoading) {
    return (
      <Box className="flex-1 items-center justify-center p-6">
        <Loading />
      </Box>
    );
  }

  if (preferencesError) {
    return (
      <Box className="flex-1 items-center justify-center p-6">
        <Text className="text-text-secondary">{preferencesError}</Text>
      </Box>
    );
  }

  return (
    <Box className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Box className="gap-4 px-4 pb-10 pt-4">
          <Box className="flex-row gap-3">
            {isEditMode ? (
              <>
                <CancelButton
                  onPress={handleCancel}
                  disabled={loading}
                  size="sm"
                  className="flex-1"
                >
                  {t("profile.account.cancel")}
                </CancelButton>
                <Button
                  onPress={handleSave}
                  disabled={loading}
                  loading={loading}
                  variant="primary"
                  size="sm"
                  iconName="save"
                  className="flex-1"
                >
                  {loading ? t("profile.account.saving_save") : t("profile.account.save")}
                </Button>
              </>
            ) : (
              <Button
                onPress={handleStartEdit}
                variant="primary"
                size="sm"
                iconName="edit"
                className="self-start"
              >
                {t("profile.account.edit")}
              </Button>
            )}
          </Box>

          <UnderlineTabs
            items={STEPS.map((step) => {
              const status =
                sectionCompletion[step.id as keyof typeof sectionCompletion] ?? "empty";
              const isComplete = status === "complete";
              const needsAttention = status === "needs_attention";
              const icon = step.icon
                ? React.createElement(step.icon, { className: "h-4 w-4" })
                : undefined;
              const suffix = isComplete ? " ✓" : !isComplete && needsAttention ? " •" : "";
              return {
                id: step.id,
                label: `${step.title}${suffix}`,
                icon,
              };
            })}
            activeId={activeSection}
            onChange={(id) => setActiveSection(id)}
            compact
            className="mb-4"
          />

          {activeSection === "demographics" && (
            <ProfileDemographicsSection
              formData={formData}
              isEditMode={isEditMode}
              updateField={updateField}
              profilePictureUrl={userProfile?.profile_picture_url}
              onUploadPhoto={handleChangeProfilePhoto}
              isUploadingProfilePicture={isUploadingProfilePicture}
              profilePictureError={profilePictureError}
              userDisplayName={userProfile?.name}
            />
          )}

          {activeSection === "financial" && (
            <ProfileFinancialSection
              formData={formData}
              isEditMode={isEditMode}
              updateField={updateField}
            />
          )}

          {activeSection === "location" && (
            <ProfileLocationSection
              formData={formData}
              isEditMode={isEditMode}
              updateField={updateField}
            />
          )}

          {activeSection === "housing" && (
            <ProfileHousingSection
              formData={formData}
              isEditMode={isEditMode}
              updateField={updateField}
            />
          )}

          {activeSection === "communication" && (
            <ProfileCommunicationSection
              formData={formData}
              isEditMode={isEditMode}
              updateField={updateField}
            />
          )}
        </Box>
      </ScrollView>
    </Box>
  );
}
