/* eslint-disable silverkey/max-lines-hard, max-lines-per-function -- TODO: split into subcomponents (ProfileForm, ProfileSections) */
import React, { useCallback, useEffect, useMemo, useState } from "react";

import * as DocumentPicker from "expo-document-picker";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

import { getPersonalizationStepsUi } from "packages/features/profile/components/profilePicture/profileStepsUi";
import BudgetRangeSlider from "packages/features/profile/components/settings/inputs/BudgetRangeSlider";
import { ImportantLocationsInputNative } from "packages/features/profile/components/settings/inputs/ImportantLocationsInput.native";
import PriceRangeSlider from "packages/features/profile/components/settings/inputs/PriceRangeSlider";
import type { HomePriceResult, OnboardingData } from "packages/features/profile/utils";
import {
  ARCHITECTURAL_STYLE_OPTIONS,
  calculateAffordableHomePrice,
  COMMUNICATION_FREQUENCY_OPTIONS,
  CREDIT_SCORE_OPTIONS,
  DAYS_ON_MARKET_TICK_VALUES,
  FIELD_LABELS,
  getProfileSectionCompletion,
  handleSubmit as handleSubmitUtil,
  HOME_AGE_YEARS_TICK_VALUES,
  INFORMATION_DETAIL_OPTIONS,
  IS_AGENT_OPTIONS,
  LOT_SIZE_ACRES_TICK_VALUES,
  SECTION_TITLES,
  SQFT_TICK_VALUES,
  userPreferencesToOnboardingData,
  validateSettingsData,
} from "packages/features/profile/utils";
import { usePreferencesSubmit } from "packages/hooks/data/auth/usePreferencesSubmit";
import { useProfilePictureUpload } from "packages/hooks/data/auth/useProfilePictureUpload";
import { useUserData, useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { showErrorToast } from "packages/hooks/ui";
import { Pressable } from "packages/ui/components/primitives";
import { Loading } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Input } from "packages/ui/components/primitives/input";
import { Image } from "packages/ui/components/primitives/media";
import { Text } from "packages/ui/components/primitives/text";
import { MOBILE_TEXT_INPUT_CLASS } from "packages/ui/styles/nativeFormStyles.native";

type PickerAsset = DocumentPicker.DocumentPickerAsset;

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

function getOptionLabel(options: readonly { value: string; label: string }[], value?: string) {
  if (!value) return "Not specified";
  return options.find((opt) => opt.value === value)?.label ?? "Not specified";
}

function getInitials(name?: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.charAt(0).toUpperCase();
}

export function ProfileScreenNative() {
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

  const renderReadOnlyValue = (value: string | number | undefined | null) => (
    <Box className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <Text className="text-base text-gray-900">
        {value === undefined || value === null || value === "" ? "Not specified" : String(value)}
      </Text>
    </Box>
  );

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
          <Box className="gap-3">
            <Box className="flex-row items-center gap-3">
              <Box className="h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                {userProfile?.profile_picture_url ? (
                  <Image
                    source={{ uri: userProfile.profile_picture_url }}
                    className="h-14 w-14 rounded-full"
                  />
                ) : (
                  <Text className="text-xl font-semibold text-gray-700">
                    {getInitials(userProfile?.name) ?? "?"}
                  </Text>
                )}
              </Box>
              <Box className="flex-1">
                <Text className="text-sm text-gray-600">
                  Complete these sections so we can personalize recommendations, alerts, and your
                  affordability estimates across SilverKey.
                </Text>
                <Box className="mt-2 flex-row gap-3">
                  <Pressable
                    onPress={handleChangeProfilePhoto}
                    disabled={isUploadingProfilePicture}
                    className="rounded-full border border-gray-300 bg-white px-4 py-2"
                  >
                    <Text className="text-sm font-medium text-gray-900">
                      {userProfile?.profile_picture_url ? "Change photo" : "Upload photo"}
                    </Text>
                  </Pressable>
                </Box>
                {profilePictureError && (
                  <Text className="mt-1 text-xs text-red-500">{profilePictureError.message}</Text>
                )}
              </Box>
            </Box>

            <Box className="mt-2 flex-row gap-3">
              {isEditMode ? (
                <>
                  <Pressable
                    onPress={handleCancel}
                    disabled={loading}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3"
                  >
                    <Text className="text-center text-base font-semibold text-gray-800">
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSave}
                    disabled={loading}
                    className="bg-brand-accent flex-1 rounded-lg px-4 py-3 active:opacity-90"
                  >
                    <Text className="text-center text-base font-semibold text-white">
                      {loading ? "Saving…" : "Save"}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  onPress={handleStartEdit}
                  className="bg-brand-accent self-start rounded-lg px-5 py-3 active:opacity-90"
                >
                  <Text className="text-base font-semibold text-white">Edit profile</Text>
                </Pressable>
              )}
            </Box>
          </Box>

          {/* Section navigation (sidebar equivalent for mobile) */}
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
              return (
                <Pressable
                  key={step.id}
                  onPress={() => setActiveSection(step.id)}
                  className={`mr-2 rounded-full px-4 py-2 ${
                    isActive ? "bg-brand-accent" : "bg-gray-100"
                  }`}
                >
                  <Box className="flex-row items-center gap-1">
                    {isComplete ? (
                      <Text className={`text-xs ${isActive ? "text-white" : "text-brand-accent"}`}>
                        ✓
                      </Text>
                    ) : null}
                    {!isComplete && needsAttention ? (
                      <Text className={`text-xs ${isActive ? "text-gold" : "text-gold"}`}>•</Text>
                    ) : null}
                    <Text
                      className={`text-sm font-medium ${isActive ? "text-white" : "text-gray-800"}`}
                    >
                      {step.title}
                    </Text>
                  </Box>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Demographics */}
          {activeSection === "demographics" && (
            <Box className="gap-4">
              <Text className="text-lg font-medium text-gray-800">About you</Text>

              <Box>
                <Text className="mb-2 text-sm font-medium text-gray-700">{FIELD_LABELS.NAME}</Text>
                {isEditMode ? (
                  <Input
                    value={formData.name ?? ""}
                    onValueChange={(v) => updateField("name", v || undefined)}
                    placeholder="Your name"
                    keyboardType="default"
                    className={MOBILE_TEXT_INPUT_CLASS}
                  />
                ) : (
                  renderReadOnlyValue(formData.name)
                )}
              </Box>

              <Box>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  {FIELD_LABELS.IS_AGENT}
                </Text>
                {isEditMode ? (
                  <Box className="flex-row flex-wrap gap-2">
                    {IS_AGENT_OPTIONS.map((option) => {
                      const selected = formData.is_agent === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => updateField("is_agent", option.value)}
                          className={`rounded-full px-4 py-2 ${
                            selected ? "bg-brand-accent" : "border border-gray-200 bg-white"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              selected ? "text-white" : "text-gray-800"
                            }`}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </Box>
                ) : (
                  renderReadOnlyValue(getOptionLabel(IS_AGENT_OPTIONS, formData.is_agent))
                )}
              </Box>

              <Box>
                <Text className="mb-2 text-sm font-medium text-gray-700">{FIELD_LABELS.AGE}</Text>
                {isEditMode ? (
                  <Input
                    value={formData.age?.toString() ?? ""}
                    onValueChange={(v) =>
                      updateField("age", v ? parseInt(v, 10) || undefined : undefined)
                    }
                    placeholder="Age"
                    keyboardType="number-pad"
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
                  />
                ) : (
                  renderReadOnlyValue(formData.age)
                )}
              </Box>
            </Box>
          )}

          {/* Financial */}
          {activeSection === "financial" && (
            <Box className="gap-4">
              <Text className="text-lg font-medium text-gray-800">
                {SECTION_TITLES.FINANCIAL_PROFILE}
              </Text>

              <Box>
                <Text className="mb-2 w-full text-center text-sm font-medium text-gray-700">
                  {FIELD_LABELS.HOME_BUDGET}
                </Text>
                {isEditMode ? (
                  <BudgetRangeSlider
                    tickValues={[
                      200000, 400000, 600000, 1000000, 1500000, 2500000, 4000000, 6000000, 10000000,
                    ]}
                    minValue={formData.home_budget_min ?? 200000}
                    maxValue={formData.home_budget_max ?? 1000000}
                    onChange={(minVal, maxVal) => {
                      const roundedMin = Math.round(minVal / 25000) * 25000;
                      const roundedMax = Math.round(maxVal / 25000) * 25000;
                      updateField("home_budget_min", roundedMin);
                      updateField("home_budget_max", roundedMax);
                    }}
                    formatPrefix="$"
                    className="mt-2"
                  />
                ) : (
                  <Box className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <Text className="text-center text-base text-gray-900">
                      ${(formData.home_budget_min ?? 0).toLocaleString()} – $
                      {(formData.home_budget_max ?? 0).toLocaleString()}
                    </Text>
                  </Box>
                )}
              </Box>

              <Box>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  {FIELD_LABELS.GROSS_INCOME}
                </Text>
                {isEditMode ? (
                  <PriceRangeSlider
                    tickValues={[50000, 100000, 200000, 300000, 500000, 750000, 1000000]}
                    value={formData.gross_income ?? 100000}
                    onChange={(v) => {
                      updateField("gross_income", Math.round(v / 5000) * 5000);
                    }}
                    formatPrefix="$"
                    className="mt-2"
                  />
                ) : (
                  renderReadOnlyValue(
                    formData.gross_income ? `$${formData.gross_income.toLocaleString()}` : undefined
                  )
                )}
              </Box>

              <Box>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  {FIELD_LABELS.DOWN_PAYMENT}
                </Text>
                {isEditMode ? (
                  <PriceRangeSlider
                    tickValues={[100000, 250000, 500000, 1000000, 2000000, 5000000]}
                    value={formData.down_payment ?? 100000}
                    onChange={(v) => {
                      updateField("down_payment", Math.round(v / 5000) * 5000);
                    }}
                    formatPrefix="$"
                    className="mt-2"
                  />
                ) : (
                  renderReadOnlyValue(
                    formData.down_payment ? `$${formData.down_payment.toLocaleString()}` : undefined
                  )
                )}
              </Box>

              <Box>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  {FIELD_LABELS.IDEAL_ZIP_CODE}
                </Text>
                {isEditMode ? (
                  <Input
                    value={formData.ideal_zip_code ?? ""}
                    onValueChange={(v) => updateField("ideal_zip_code", v || undefined)}
                    placeholder="e.g. 90210"
                    keyboardType="default"
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
                  />
                ) : (
                  renderReadOnlyValue(formData.ideal_zip_code)
                )}
              </Box>

              <Box>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  {FIELD_LABELS.CREDIT_SCORE_RANGE}
                </Text>
                {isEditMode ? (
                  <Box className="flex-row flex-wrap gap-2">
                    {CREDIT_SCORE_OPTIONS.map((option) => {
                      const selected = formData.credit_score_range === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => updateField("credit_score_range", option.value)}
                          className={`rounded-full px-4 py-2 ${
                            selected ? "bg-brand-accent" : "border border-gray-200 bg-white"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              selected ? "text-white" : "text-gray-800"
                            }`}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </Box>
                ) : (
                  renderReadOnlyValue(
                    getOptionLabel(CREDIT_SCORE_OPTIONS, formData.credit_score_range)
                  )
                )}
              </Box>

              <Box className="mt-2 rounded-lg border border-gray-200 bg-white px-4 py-3">
                <Box className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-gray-900">
                    Affordability estimate
                  </Text>
                  <Pressable
                    onPress={() => setIsAffordabilityCollapsed((prev) => !prev)}
                    className="px-2 py-1"
                  >
                    <Text className="text-brand-accent text-xs font-medium">
                      {isAffordabilityCollapsed ? "Show details" : "Hide details"}
                    </Text>
                  </Pressable>
                </Box>

                {homePriceLoading ? (
                  <Box className="mt-2">
                    <Text className="text-sm text-gray-600">Calculating estimate…</Text>
                  </Box>
                ) : homePriceError ? (
                  <Box className="mt-2">
                    <Text className="text-sm text-red-500">{homePriceError}</Text>
                  </Box>
                ) : homePriceResult ? (
                  <Box className="mt-3 gap-1">
                    <Text className="text-sm text-gray-800">
                      Estimated max home price:{" "}
                      <Text className="font-semibold">
                        ${homePriceResult.maxHomePrice.toLocaleString()}
                      </Text>
                    </Text>
                    {!isAffordabilityCollapsed && (
                      <>
                        <Text className="text-sm text-gray-800">
                          Estimated monthly housing cost:{" "}
                          <Text className="font-semibold">
                            ${homePriceResult.totalMonthlyHousingCost.toLocaleString()}
                          </Text>
                        </Text>
                        <Text className="mt-1 text-xs text-gray-600">
                          This estimate uses your income, down payment, and credit band to give a
                          realistic upper bound on what you can comfortably afford.
                        </Text>
                      </>
                    )}
                  </Box>
                ) : (
                  <Box className="mt-2">
                    <Text className="text-sm text-gray-600">
                      Enter your income and ideal zip code to see an affordability estimate.
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Location */}
          {activeSection === "location" && (
            <Box className="gap-4">
              <Text className="text-lg font-medium text-gray-800">
                {SECTION_TITLES.LOCATION_PREFERENCES}
              </Text>

              <Box className="rounded-lg bg-emerald-50 px-4 py-3">
                <Text className="text-xs font-medium text-emerald-900">
                  Map preview based on your important locations.
                </Text>
                <Text className="mt-1 text-xs text-emerald-800">
                  Native map integration will show commute-friendly areas as you refine addresses.
                </Text>
              </Box>

              <Box>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  {FIELD_LABELS.IMPORTANT_LOCATIONS} (e.g. work)
                </Text>
                {Array.isArray(formData.important_locations) &&
                formData.important_locations.length === 0 ? (
                  <Text className="mb-2 text-xs text-gray-600">
                    Add work, school, or frequently visited places to guide commute-friendly search
                    results.
                  </Text>
                ) : null}
                <ImportantLocationsInputNative
                  locations={
                    Array.isArray(formData.important_locations) ? formData.important_locations : []
                  }
                  onChange={(next) => updateField("important_locations", next)}
                  isEditMode={isEditMode}
                />
              </Box>
            </Box>
          )}

          {/* Housing */}
          {activeSection === "housing" && (
            <Box className="gap-4">
              <Text className="text-lg font-medium text-gray-800">
                {SECTION_TITLES.HOUSING_PREFERENCES}
              </Text>

              <Box>
                <Text className="mb-2 w-full text-center text-sm font-medium text-gray-700">
                  {FIELD_LABELS.SQUARE_FEET}
                </Text>
                {isEditMode ? (
                  <BudgetRangeSlider
                    tickValues={SQFT_TICK_VALUES}
                    minValue={formData.preferred_sqft_min ?? SQFT_TICK_VALUES[0]}
                    maxValue={
                      formData.preferred_sqft_max ?? SQFT_TICK_VALUES[SQFT_TICK_VALUES.length - 1]
                    }
                    onChange={(minVal, maxVal) => {
                      updateField("preferred_sqft_min", minVal);
                      updateField("preferred_sqft_max", maxVal);
                    }}
                    formatValue={(v) => `${v.toLocaleString()} sq ft`}
                    formatPrefix=""
                    minGap={250}
                    className="mt-2"
                  />
                ) : (
                  <Box className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <Text className="text-center text-base text-gray-900">
                      {(formData.preferred_sqft_min ?? SQFT_TICK_VALUES[0]).toLocaleString()} –{" "}
                      {(
                        formData.preferred_sqft_max ?? SQFT_TICK_VALUES[SQFT_TICK_VALUES.length - 1]
                      ).toLocaleString()}{" "}
                      sq ft
                    </Text>
                  </Box>
                )}
              </Box>

              <Box>
                <Text className="mb-2 w-full text-center text-sm font-medium text-gray-700">
                  {FIELD_LABELS.DAYS_ON_MARKET}
                </Text>
                {isEditMode ? (
                  <BudgetRangeSlider
                    tickValues={DAYS_ON_MARKET_TICK_VALUES}
                    minValue={formData.days_on_market_min ?? DAYS_ON_MARKET_TICK_VALUES[0]}
                    maxValue={
                      formData.days_on_market_max ??
                      DAYS_ON_MARKET_TICK_VALUES[DAYS_ON_MARKET_TICK_VALUES.length - 1]
                    }
                    onChange={(minVal, maxVal) => {
                      updateField("days_on_market_min", minVal);
                      updateField("days_on_market_max", maxVal);
                    }}
                    formatValue={(v) => `${v} days`}
                    formatPrefix=""
                    minGap={7}
                    className="mt-2"
                  />
                ) : (
                  <Box className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <Text className="text-center text-base text-gray-900">
                      {formData.days_on_market_min ?? DAYS_ON_MARKET_TICK_VALUES[0]} –{" "}
                      {formData.days_on_market_max ??
                        DAYS_ON_MARKET_TICK_VALUES[DAYS_ON_MARKET_TICK_VALUES.length - 1]}{" "}
                      days
                    </Text>
                  </Box>
                )}
              </Box>

              <Box>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  {FIELD_LABELS.PREFERRED_BEDROOMS}
                </Text>
                {isEditMode ? (
                  <Input
                    value={formData.preferred_bedrooms?.toString() ?? ""}
                    onValueChange={(v) =>
                      updateField(
                        "preferred_bedrooms",
                        v ? parseInt(v, 10) || undefined : undefined
                      )
                    }
                    placeholder="Number of bedrooms"
                    keyboardType="number-pad"
                    className={MOBILE_TEXT_INPUT_CLASS}
                  />
                ) : (
                  renderReadOnlyValue(formData.preferred_bedrooms)
                )}
              </Box>

              <Box>
                <Text className="mb-2 w-full text-center text-sm font-medium text-gray-700">
                  {FIELD_LABELS.PREFERRED_LOT_SIZE}
                </Text>
                {isEditMode ? (
                  <BudgetRangeSlider
                    tickValues={LOT_SIZE_ACRES_TICK_VALUES}
                    minValue={formData.preferred_lot_size_min ?? LOT_SIZE_ACRES_TICK_VALUES[0]}
                    maxValue={
                      formData.preferred_lot_size_max ??
                      LOT_SIZE_ACRES_TICK_VALUES[LOT_SIZE_ACRES_TICK_VALUES.length - 1]
                    }
                    onChange={(minVal, maxVal) => {
                      updateField("preferred_lot_size_min", minVal);
                      updateField("preferred_lot_size_max", maxVal);
                    }}
                    formatValue={(v) => `${v} ac`}
                    formatPrefix=""
                    minGap={0.1}
                    className="mt-2"
                  />
                ) : (
                  <Box className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <Text className="text-center text-base text-gray-900">
                      {formData.preferred_lot_size_min ?? LOT_SIZE_ACRES_TICK_VALUES[0]} –{" "}
                      {formData.preferred_lot_size_max ??
                        LOT_SIZE_ACRES_TICK_VALUES[LOT_SIZE_ACRES_TICK_VALUES.length - 1]}{" "}
                      acres
                    </Text>
                  </Box>
                )}
              </Box>

              <Box>
                <Text className="mb-2 w-full text-center text-sm font-medium text-gray-700">
                  {FIELD_LABELS.PREFERRED_HOME_AGE}
                </Text>
                {isEditMode ? (
                  <PriceRangeSlider
                    tickValues={HOME_AGE_YEARS_TICK_VALUES}
                    value={
                      formData.preferred_home_age_max ??
                      HOME_AGE_YEARS_TICK_VALUES[HOME_AGE_YEARS_TICK_VALUES.length - 1]
                    }
                    onChange={(val) => updateField("preferred_home_age_max", val)}
                    formatValue={(v) => `${v} years`}
                    formatPrefix=""
                    className="mt-2"
                  />
                ) : (
                  <Box className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <Text className="text-center text-base text-gray-900">
                      {formData.preferred_home_age_max != null
                        ? `Up to ${formData.preferred_home_age_max} years`
                        : "Not specified"}
                    </Text>
                  </Box>
                )}
              </Box>

              <Box>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  {FIELD_LABELS.PREFERRED_BATHROOMS}
                </Text>
                {isEditMode ? (
                  <Input
                    value={formData.preferred_bathrooms?.toString() ?? ""}
                    onValueChange={(v) =>
                      updateField(
                        "preferred_bathrooms",
                        v ? parseInt(v, 10) || undefined : undefined
                      )
                    }
                    placeholder="Number of bathrooms"
                    keyboardType="number-pad"
                    className={MOBILE_TEXT_INPUT_CLASS}
                  />
                ) : (
                  renderReadOnlyValue(formData.preferred_bathrooms)
                )}
              </Box>

              <Box>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  {FIELD_LABELS.PREFERRED_ARCHITECTURAL_STYLE}
                </Text>
                {isEditMode ? (
                  <Box className="flex-row flex-wrap gap-2">
                    {ARCHITECTURAL_STYLE_OPTIONS.map((option) => {
                      const selected = formData.preferred_architectural_style === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => updateField("preferred_architectural_style", option.value)}
                          className={`rounded-full px-4 py-2 ${
                            selected ? "bg-brand-accent" : "border border-gray-200 bg-white"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              selected ? "text-white" : "text-gray-800"
                            }`}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </Box>
                ) : (
                  renderReadOnlyValue(
                    ARCHITECTURAL_STYLE_OPTIONS.find(
                      (opt) => opt.value === formData.preferred_architectural_style
                    )?.label
                  )
                )}
              </Box>
            </Box>
          )}

          {/* Communication */}
          {activeSection === "communication" && (
            <Box className="gap-4">
              <Text className="text-lg font-medium text-gray-800">
                {SECTION_TITLES.COMMUNICATION_PREFERENCES}
              </Text>

              <Box>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  {FIELD_LABELS.COMMUNICATION_FREQUENCY}
                </Text>
                {isEditMode ? (
                  <Box className="flex-row flex-wrap gap-2">
                    {COMMUNICATION_FREQUENCY_OPTIONS.map((option) => {
                      const selected = formData.communication_frequency === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => updateField("communication_frequency", option.value)}
                          className={`rounded-full px-4 py-2 ${
                            selected ? "bg-brand-accent" : "border border-gray-200 bg-white"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              selected ? "text-white" : "text-gray-800"
                            }`}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </Box>
                ) : (
                  renderReadOnlyValue(
                    getOptionLabel(
                      COMMUNICATION_FREQUENCY_OPTIONS,
                      formData.communication_frequency
                    )
                  )
                )}
              </Box>

              <Box>
                <Text className="mb-2 text-sm font-medium text-gray-700">
                  {FIELD_LABELS.INFORMATION_DETAIL_LEVEL}
                </Text>
                {isEditMode ? (
                  <Box className="flex-row flex-wrap gap-2">
                    {INFORMATION_DETAIL_OPTIONS.map((option) => {
                      const selected = formData.information_detail_level === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => updateField("information_detail_level", option.value)}
                          className={`rounded-full px-4 py-2 ${
                            selected ? "bg-brand-accent" : "border border-gray-200 bg-white"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              selected ? "text-white" : "text-gray-800"
                            }`}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </Box>
                ) : (
                  renderReadOnlyValue(
                    getOptionLabel(INFORMATION_DETAIL_OPTIONS, formData.information_detail_level)
                  )
                )}
              </Box>
            </Box>
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
