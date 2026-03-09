import React, { useCallback, useEffect, useMemo, useState } from "react";

import * as DocumentPicker from "expo-document-picker";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

import { useLocalization } from "packages/contexts";
import { getPersonalizationStepsUi } from "packages/features/profile/components/profilePicture/profileStepsUi";
import { ProfileCommunicationSection } from "packages/features/profile/components/profileScreen/ProfileCommunicationSection.native";
import { ProfileDemographicsSection } from "packages/features/profile/components/profileScreen/ProfileDemographicsSection.native";
import { ProfileFinancialSection } from "packages/features/profile/components/profileScreen/ProfileFinancialSection.native";
import { ProfileHousingSection } from "packages/features/profile/components/profileScreen/ProfileHousingSection.native";
import { ProfileLocationSection } from "packages/features/profile/components/profileScreen/ProfileLocationSection.native";
import type { HomePriceResult, OnboardingData } from "packages/features/profile/utils";
import {
  calculateAffordableHomePrice,
  getProfileSectionCompletion,
  handleSubmit as handleSubmitUtil,
  userPreferencesToOnboardingData,
  validateSettingsData,
} from "packages/features/profile/utils";
import { usePreferencesSubmit } from "packages/hooks/data/auth/usePreferencesSubmit";
import { useProfilePictureUpload } from "packages/hooks/data/auth/useProfilePictureUpload";
import { useUserData, useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { showErrorToast } from "packages/hooks/ui";
import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import { Icon } from "packages/ui/components/primitives";
import { ScrollView } from "packages/ui/components/primitives";
import { Pressable } from "packages/ui/components/primitives";
import { Loading } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import type { IconName } from "packages/ui/types/icons";

type PickerAsset = DocumentPicker.DocumentPickerAsset;

const STEP_ICON_NAMES: Record<string, IconName> = {
  demographics: "user",
  housing: "home",
  location: "map-pin",
  communication: "message-square",
  financial: "building",
};

type UploadableImageFile = File & {
  uri?: string;
};

const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_PROFILE_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif"] as const;

function validateProfileImage(asset: PickerAsset | null): string | null {
  if (!asset) return "No image selected.";

  if (asset.size != null && asset.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
    return "Image must be 5MB or smaller.";
  }

  if (asset.mimeType && !ALLOWED_PROFILE_IMAGE_MIME_TYPES.includes(asset.mimeType as never)) {
    return "Please use a JPEG, PNG, or GIF image.";
  }

  return null;
}

export function ProfileScreenNative() {
  const { t } = useLocalization();
  const { userProfile } = useUserData();
  const { userPreferences, preferencesLoading, preferencesError, refreshUserPreferences } =
    useUserPreferences();
  const submitPreferences = usePreferencesSubmit();
  const {
    uploadProfilePicture,
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

  const [homePriceResult, setHomePriceResult] = useState<HomePriceResult | null>(null);
  const [homePriceLoading, setHomePriceLoading] = useState(false);
  const [homePriceError, setHomePriceError] = useState<string | null>(null);
  const [isAffordabilityCollapsed, setIsAffordabilityCollapsed] = useState(false);
  const STEPS = getPersonalizationStepsUi();
  const [activeSection, setActiveSection] = useState<string>(STEPS[0]?.id ?? "demographics");

  const sectionCompletion = useMemo(() => getProfileSectionCompletion(formData), [formData]);

  const handleChangeProfilePhoto = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: ["image/*"],
      });

      if (result.canceled) return;

      const asset: PickerAsset | null = result.assets[0] ?? null;
      const validationError = validateProfileImage(asset);

      if (validationError) {
        showErrorToast(validationError);
        return;
      }

      if (!asset?.uri) {
        showErrorToast("Unable to read the selected image. Please try again.");
        return;
      }

      const pseudoFile: UploadableImageFile = {
        uri: asset.uri,
        name: asset.name ?? "profile-picture",
        type: asset.mimeType ?? "image/jpeg",
        size: asset.size ?? 0,
      } as UploadableImageFile;

      await uploadProfilePicture(pseudoFile);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload profile picture. Please try again.";
      showErrorToast(message);
    }
  }, [uploadProfilePicture]);

  useEffect(() => {
    if (
      showValidationWarning &&
      (validationResult.missingFields.length > 0 || validationResult.errors.length > 0)
    ) {
      const message = [...validationResult.missingFields, ...validationResult.errors].join("\n");
      Alert.alert("Please complete your profile", message, [
        { text: "OK", onPress: () => setShowValidationWarning(false) },
      ]);
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

  const calculateHomePrice = useCallback(() => {
    if (!formData.gross_income || !formData.ideal_zip_code) {
      setHomePriceResult(null);
      setHomePriceError(null);
      return;
    }

    try {
      setHomePriceLoading(true);
      setHomePriceError(null);

      const result = calculateAffordableHomePrice(formData);

      if ("error" in result) {
        setHomePriceError(
          "We couldn't calculate an estimate. Check your income and zip code and try again."
        );
        setHomePriceResult(null);
      } else {
        setHomePriceResult(result);
      }
    } catch (error: unknown) {
      setHomePriceError(
        error instanceof Error
          ? error.message
          : "We couldn't calculate an estimate. Check your income and zip code and try again."
      );
      setHomePriceResult(null);
    } finally {
      setHomePriceLoading(false);
    }
  }, [formData]);

  useEffect(() => {
    if (formData.gross_income && formData.ideal_zip_code) {
      calculateHomePrice();
    } else {
      setHomePriceResult(null);
      setHomePriceError(null);
    }
  }, [
    formData.gross_income,
    formData.down_payment,
    formData.ideal_zip_code,
    formData.credit_score_range,
    calculateHomePrice,
  ]);

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
      <View style={styles.centered}>
        <Loading />
      </View>
    );
  }

  if (preferencesError) {
    return (
      <View style={styles.centered}>
        <Text className="text-gray-600">{preferencesError}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      /* eslint-disable-next-line silverkey/no-platform-feature-check -- Keyboard behavior differs by platform; useFeature is for product rollout, not layout */
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionTabs}
          >
            {STEPS.map((step) => {
              const isActive = activeSection === step.id;
              const status =
                sectionCompletion[step.id as keyof typeof sectionCompletion] ?? "empty";
              const isComplete = status === "complete";
              const needsAttention = status === "needs_attention";
              const iconName = STEP_ICON_NAMES[step.id];
              return (
                <Pressable
                  key={step.id}
                  onPress={() => setActiveSection(step.id)}
                  className={`mr-2 rounded-full px-4 py-2 ${isActive ? "bg-gold" : "bg-gray-100"}`}
                >
                  <Box className="flex-row items-center gap-2">
                    {iconName != null ? (
                      <Icon
                        name={iconName}
                        size={16}
                        className={isActive ? "text-white" : "text-gray-600"}
                      />
                    ) : null}
                    {isComplete ? (
                      <Text
                        className={`text-xs ${isActive ? "text-off-white" : "text-brand-accent"}`}
                      >
                        ✓
                      </Text>
                    ) : null}
                    {!isComplete && needsAttention ? (
                      <Text className="text-gold text-xs">•</Text>
                    ) : null}
                    <Text
                      className={`text-sm font-medium ${isActive ? "text-off-white" : "text-gray-800"}`}
                    >
                      {step.title}
                    </Text>
                  </Box>
                </Pressable>
              );
            })}
          </ScrollView>

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
              homePriceResult={homePriceResult}
              homePriceLoading={homePriceLoading}
              homePriceError={homePriceError}
              isAffordabilityCollapsed={isAffordabilityCollapsed}
              setIsAffordabilityCollapsed={setIsAffordabilityCollapsed}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sectionTabs: {
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});
