import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AccountLogoutAction } from "packages/features/homeauth/components/account/AccountLogoutAction";
import { getPersonalizationStepsUi } from "packages/features/profile/components/profilePicture/profileStepsUi";
import { buildProfileUnderlineTabItems } from "packages/features/profile/components/profileScreen/buildProfileUnderlineTabItems";
import { validateProfilePhotoFile } from "packages/features/profile/components/profileScreen/profilePhotoValidation";
import { ProfileScreenActiveSectionPanel } from "packages/features/profile/components/profileScreen/ProfileScreenActiveSectionPanel";
import { ProfileScreenPhotoFileInput } from "packages/features/profile/components/profileScreen/ProfileScreenPhotoFileInput";
import { ProfileScreenPreferenceToolbar } from "packages/features/profile/components/profileScreen/ProfileScreenPreferenceToolbar";
import { AgentPublicProfileShareRow } from "packages/features/profile/components/profileScreen/sections/privacy/AgentPublicProfileShareRow";
import type { OnboardingData } from "packages/features/profile/utils";
import {
  getProfileSectionCompletion,
  handleSubmit as handleSubmitUtil,
  isAgentIdentityForProfileUi,
  nextPreferencesVersion,
  resolveAgentPublicProfileShare,
  userPreferencesToOnboardingData,
} from "packages/features/profile/utils";
import { usePreferencesSubmit } from "packages/hooks/data/auth/usePreferencesSubmit";
import { useProfilePictureUpload } from "packages/hooks/data/auth/useProfilePictureUpload";
import { useUserData, useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { showErrorToast } from "packages/hooks/ui";
import { log } from "packages/logger";
import { useAuthStore } from "packages/store";
import { Box, Loading, ScrollView, Text } from "packages/ui/components/primitives";
import { UnderlineTabs } from "packages/ui/components/tabs";
import { isWeb } from "packages/utils/platform";

export type ProfileScreenProps = {
  /** When set, loads that user's preferences read-only (e.g. agent client hub). */
  agentSubject?: { userId: string; displayName: string } | null;
};

export function ProfileScreen({ agentSubject = null }: ProfileScreenProps) {
  const { userProfile } = useUserData();
  const { userPreferences, preferencesLoading, preferencesError, refreshUserPreferences } =
    useUserPreferences(
      agentSubject != null ? { preferencesSubjectUserId: agentSubject.userId } : undefined
    );
  const submitPreferences = usePreferencesSubmit();
  const {
    uploadProfilePicture,
    isUploading: isUploadingProfilePicture,
    error: profilePictureError,
  } = useProfilePictureUpload();

  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<OnboardingData>({});
  const [originalData, setOriginalData] = useState<OnboardingData>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    missingFields: string[];
    errors: string[];
  }>({ missingFields: [], errors: [] });
  const [showValidationWarning, setShowValidationWarning] = useState(false);

  const isAgent = useIsAgent();
  const authUser = useAuthStore((s) => s.user);

  const profileForSync = useMemo(
    () => (agentSubject != null ? { name: agentSubject.displayName } : (userProfile ?? undefined)),
    [agentSubject, userProfile]
  );

  const isAgentForProfileUi = useMemo(
    () =>
      agentSubject != null
        ? isAgentIdentityForProfileUi(false, { roles: [] })
        : isAgentIdentityForProfileUi(isAgent, userProfile),
    [agentSubject, isAgent, userProfile]
  );
  const {
    show: showAgentPublicProfileShare,
    agentId: agentPublicProfileUserId,
    displayName: agentPublicProfileDisplayName,
  } = useMemo(
    () =>
      agentSubject != null
        ? { show: false, agentId: "", displayName: null as string | null }
        : resolveAgentPublicProfileShare({
            storeIsAgent: isAgent,
            authUser,
            userProfile,
          }),
    [agentSubject, isAgent, authUser, userProfile]
  );
  const STEPS = useMemo(() => {
    const base = getPersonalizationStepsUi(isAgentForProfileUi);
    if (agentSubject != null) {
      return base.filter((s) => s.id !== "privacy_data");
    }
    return base;
  }, [isAgentForProfileUi, agentSubject]);
  const [activeSection, setActiveSection] = useState<string>(STEPS[0]?.id ?? "demographics");
  const hasInitializedFormRef = useRef(false);

  useEffect(() => {
    hasInitializedFormRef.current = false;
  }, [agentSubject?.userId]);

  useEffect(() => {
    if (STEPS.length > 0 && !STEPS.some((s) => s.id === activeSection)) {
      setActiveSection(STEPS[0]?.id ?? "demographics");
    }
  }, [STEPS, activeSection]);

  const effectiveEditMode = agentSubject != null ? false : isEditMode;

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

  useEffect(() => {
    if (preferencesLoading) return;
    if (hasInitializedFormRef.current) return;
    hasInitializedFormRef.current = true;
    const data = userPreferencesToOnboardingData(
      userPreferences ? (userPreferences as Record<string, unknown>) : null,
      profileForSync
    );
    setFormData(data);
    setOriginalData(data);
  }, [preferencesLoading, userPreferences, profileForSync]);

  useEffect(() => {
    if (agentSubject != null) return;
    if (!hasInitializedFormRef.current) return;
    const nameFromProfile =
      userProfile != null && typeof userProfile.name === "string" && userProfile.name.trim() !== ""
        ? userProfile.name.trim()
        : undefined;
    if (!nameFromProfile) return;
    setFormData((prev) => (prev.name ? prev : { ...prev, name: nameFromProfile }));
    setOriginalData((prev) => (prev.name ? prev : { ...prev, name: nameFromProfile }));
  }, [agentSubject, userProfile]);

  const updateField = useCallback((field: keyof OnboardingData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const patchBuyerPreferenceExtensions = useCallback(
    (
      fn: (
        prev: OnboardingData["buyerPreferenceExtensions"]
      ) => NonNullable<OnboardingData["buyerPreferenceExtensions"]>
    ) => {
      setFormData((prev) => ({
        ...prev,
        buyerPreferenceExtensions: fn(prev.buyerPreferenceExtensions),
      }));
    },
    []
  );

  const handleStartEdit = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const handleCancel = useCallback(() => {
    setFormData(originalData);
    setIsEditMode(false);
  }, [originalData]);

  const handleSave = useCallback(async () => {
    const newVersion = nextPreferencesVersion(formData.preferences_version);

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
      skipValidation: true,
      onSuccess: () => {
        setFormData(dataToSave);
        setOriginalData(dataToSave);
        setIsEditMode(false);
        void refreshUserPreferences();
      },
      onShowError: showErrorToast,
    });
  }, [formData, submitPreferences, refreshUserPreferences]);

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
            className="mb-4"
          />

          <ProfileScreenActiveSectionPanel
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
