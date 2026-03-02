/* eslint-disable silverkey/max-lines-hard, max-lines-per-function -- TODO: split into subcomponents (ProfileForm, ProfileSections) */
import React, { useCallback, useEffect, useState } from "react";

import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Linking } from "react-native";

import { getEnv } from "packages/config";
import type { HomePriceResult, OnboardingData } from "packages/features/profile/utils";
import {
  calculateAffordableHomePrice,
  COMMUNICATION_FREQUENCY_OPTIONS,
  CREDIT_SCORE_OPTIONS,
  FIELD_LABELS,
  handleSubmit as handleSubmitUtil,
  INFORMATION_DETAIL_OPTIONS,
  IS_AGENT_OPTIONS,
  SECTION_TITLES,
  validateSettingsData,
} from "packages/features/profile/utils";
import { usePreferencesSubmit } from "packages/hooks/data/auth/usePreferencesSubmit";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { showErrorToast } from "packages/hooks/ui";
import { Pressable } from "packages/ui/components/primitives";
import { Loading } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Input } from "packages/ui/components/primitives/input";
import { Text } from "packages/ui/components/primitives/text";
import { MOBILE_TEXT_INPUT_CLASS } from "packages/ui/styles/nativeFormStyles.native";

function preferencesToFormData(prefs: Record<string, unknown> | null): OnboardingData {
  if (!prefs) return {};
  return { ...prefs } as OnboardingData;
}

function getOptionLabel(options: readonly { value: string; label: string }[], value?: string) {
  if (!value) return "Not specified";
  return options.find((opt) => opt.value === value)?.label ?? "Not specified";
}

export function ProfileScreenNative() {
  const { userPreferences, preferencesLoading, preferencesError, refreshUserPreferences } =
    useUserPreferences();
  const submitPreferences = usePreferencesSubmit();

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
      const data = preferencesToFormData(userPreferences as Record<string, unknown>);
      setFormData(data);
      setOriginalData(data);
    }
  }, [userPreferences]);

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
        setHomePriceError(result.error);
        setHomePriceResult(null);
      } else {
        setHomePriceResult(result);
      }
    } catch (error: unknown) {
      setHomePriceError(
        error instanceof Error ? error.message : "Failed to calculate home price on mobile"
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
            <Text className="text-xl font-semibold text-gray-900">Profile & Preferences</Text>
            <Text className="text-sm text-gray-600">
              Manage your profile, financial details, housing, location, and communication
              preferences used across SilverKey.
            </Text>

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

          {/* Demographics */}
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

          {/* Financial */}
          <Box className="gap-4">
            <Text className="text-lg font-medium text-gray-800">
              {SECTION_TITLES.FINANCIAL_PROFILE}
            </Text>

            <Box>
              <Text className="mb-2 text-sm font-medium text-gray-700">
                {FIELD_LABELS.HOME_BUDGET} min
              </Text>
              {isEditMode ? (
                <Input
                  value={formData.home_budget_min?.toString() ?? ""}
                  onValueChange={(v) =>
                    updateField("home_budget_min", v ? parseInt(v, 10) || undefined : undefined)
                  }
                  placeholder="Minimum budget"
                  keyboardType="number-pad"
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
                />
              ) : (
                renderReadOnlyValue(
                  formData.home_budget_min
                    ? `$${formData.home_budget_min.toLocaleString()}`
                    : undefined
                )
              )}
            </Box>

            <Box>
              <Text className="mb-2 text-sm font-medium text-gray-700">
                {FIELD_LABELS.HOME_BUDGET} max
              </Text>
              {isEditMode ? (
                <Input
                  value={formData.home_budget_max?.toString() ?? ""}
                  onValueChange={(v) =>
                    updateField("home_budget_max", v ? parseInt(v, 10) || undefined : undefined)
                  }
                  placeholder="Maximum budget"
                  keyboardType="number-pad"
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
                />
              ) : (
                renderReadOnlyValue(
                  formData.home_budget_max
                    ? `$${formData.home_budget_max.toLocaleString()}`
                    : undefined
                )
              )}
            </Box>

            <Box>
              <Text className="mb-2 text-sm font-medium text-gray-700">
                {FIELD_LABELS.GROSS_INCOME}
              </Text>
              {isEditMode ? (
                <Input
                  value={formData.gross_income?.toString() ?? ""}
                  onValueChange={(v) =>
                    updateField("gross_income", v ? parseInt(v, 10) || undefined : undefined)
                  }
                  placeholder="Annual income"
                  keyboardType="number-pad"
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
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
                <Input
                  value={formData.down_payment?.toString() ?? ""}
                  onValueChange={(v) =>
                    updateField("down_payment", v ? parseInt(v, 10) || undefined : undefined)
                  }
                  placeholder="Down payment"
                  keyboardType="number-pad"
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
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

          {/* Location */}
          <Box className="gap-4">
            <Text className="text-lg font-medium text-gray-800">
              {SECTION_TITLES.LOCATION_PREFERENCES}
            </Text>

            <Box>
              <Text className="mb-2 text-sm font-medium text-gray-700">
                {FIELD_LABELS.IMPORTANT_LOCATIONS} (e.g. work)
              </Text>
              {isEditMode ? (
                <Input
                  value={formData.important_locations?.[0]?.address?.trim() ?? ""}
                  onValueChange={(v) =>
                    updateField(
                      "important_locations",
                      v?.trim()
                        ? [
                            {
                              address: v.trim(),
                              commute_tolerance:
                                formData.important_locations?.[0]?.commute_tolerance,
                            },
                          ]
                        : []
                    )
                  }
                  placeholder="Address or city"
                  keyboardType="default"
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
                />
              ) : (
                renderReadOnlyValue(formData.important_locations?.[0]?.address)
              )}
            </Box>
          </Box>

          {/* Housing */}
          <Box className="gap-4">
            <Text className="text-lg font-medium text-gray-800">
              {SECTION_TITLES.HOUSING_PREFERENCES}
            </Text>

            <Box>
              <Text className="mb-2 text-sm font-medium text-gray-700">
                {FIELD_LABELS.PREFERRED_BEDROOMS}
              </Text>
              {isEditMode ? (
                <Input
                  value={formData.preferred_bedrooms?.toString() ?? ""}
                  onValueChange={(v) =>
                    updateField("preferred_bedrooms", v ? parseInt(v, 10) || undefined : undefined)
                  }
                  placeholder="Bedrooms"
                  keyboardType="number-pad"
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
                />
              ) : (
                renderReadOnlyValue(formData.preferred_bedrooms)
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
                    updateField("preferred_bathrooms", v ? parseInt(v, 10) || undefined : undefined)
                  }
                  placeholder="Bathrooms"
                  keyboardType="number-pad"
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
                />
              ) : (
                renderReadOnlyValue(formData.preferred_bathrooms)
              )}
            </Box>
          </Box>

          {/* Communication */}
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
                  getOptionLabel(COMMUNICATION_FREQUENCY_OPTIONS, formData.communication_frequency)
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

          {/* Advanced desktop link (demoted) */}
          <Box className="mt-4 border-t border-gray-200 pt-4">
            <Text className="text-xs text-gray-500">
              Need desktop-only tools like maps and sliders? You can still open your profile on the
              web.
            </Text>
            <Pressable
              onPress={() => {
                const base = getEnv().isDevelopment
                  ? "http://localhost:5173"
                  : "https://usesilverkey.com";
                void Linking.openURL(`${base}/profile`);
              }}
              className="mt-2 self-start rounded-lg border border-gray-300 px-4 py-2"
            >
              <Text className="text-brand-accent text-sm font-medium">Open profile on web</Text>
            </Pressable>
          </Box>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});
