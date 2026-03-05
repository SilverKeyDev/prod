import React, { useCallback, useEffect, useState } from "react";

import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import {
  ARCHITECTURAL_STYLE_OPTIONS,
  HOME_AGE_OPTIONS,
  LOT_SIZE_OPTIONS,
  PROPERTY_USE_OPTIONS,
  RENOVATION_OPTIONS,
  WALKABILITY_OPTIONS,
} from "packages/features/search/types/otherFilterOptions";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { usePreferencesSubmit, useUserPreferences } from "packages/hooks/data/useUserData";
import { useSearchContextStore } from "packages/store";
import Button from "packages/ui/components/button/Button";
import CloseButton from "packages/ui/components/button/CloseButton";
import { Box } from "packages/ui/components/primitives/box";
import { Input } from "packages/ui/components/primitives/input";
import { Text } from "packages/ui/components/primitives/text";

import type { OnboardingData } from "@/features/profile/utils";

export type SearchFiltersSheetNativeProps = {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
};

function preferencesToFormData(prefs: Record<string, unknown> | null): Partial<OnboardingData> {
  if (!prefs) return {};
  return { ...prefs } as Partial<OnboardingData>;
}

export function SearchFiltersSheetNative({
  open,
  onClose,
  onApply,
}: SearchFiltersSheetNativeProps): React.ReactElement {
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const submitPreferences = usePreferencesSubmit();
  const setSearchFilterOverrides = useSearchContextStore((s) => s.setSearchFilterOverrides);

  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && userPreferences) {
      setFormData(preferencesToFormData(userPreferences as Record<string, unknown>));
    }
  }, [open, userPreferences]);

  const update = useCallback((field: keyof OnboardingData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApply = useCallback(async () => {
    setSaving(true);
    try {
      await submitPreferences(formData);
      const overrides: { preferred_bedrooms_max?: number; preferred_bathrooms_max?: number } = {};
      if (formData.preferred_bedrooms_max != null)
        overrides.preferred_bedrooms_max = formData.preferred_bedrooms_max;
      if (formData.preferred_bathrooms_max != null)
        overrides.preferred_bathrooms_max = formData.preferred_bathrooms_max;
      setSearchFilterOverrides(overrides);
      await refreshUserPreferences();
      onApply();
      onClose();
    } catch {
      setSaving(false);
    } finally {
      setSaving(false);
    }
  }, [
    formData,
    onApply,
    onClose,
    refreshUserPreferences,
    setSearchFilterOverrides,
    submitPreferences,
  ]);

  if (!open) return <></>;

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Box className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
            <Text className="text-base font-semibold text-gray-900">
              {SEARCH_TRANSLATIONS["search.filters"] ?? "Filters"}
            </Text>
            <CloseButton onClick={onClose} size="sm" />
          </Box>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Box className="mb-4 flex-row gap-2">
              <Box className="flex-1">
                <Input
                  placeholder="Min $"
                  value={formData.home_budget_min != null ? String(formData.home_budget_min) : ""}
                  onChangeText={(v) =>
                    update("home_budget_min", parseInt(v.replace(/\D/g, ""), 10) || undefined)
                  }
                  keyboardType="numeric"
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
              </Box>
              <Box className="flex-1">
                <Input
                  placeholder="Max $"
                  value={formData.home_budget_max != null ? String(formData.home_budget_max) : ""}
                  onChangeText={(v) =>
                    update("home_budget_max", parseInt(v.replace(/\D/g, ""), 10) || undefined)
                  }
                  keyboardType="numeric"
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
              </Box>
            </Box>
            <Text className="mb-1 text-xs font-medium text-gray-500">
              {SEARCH_TRANSLATIONS["search.filters_beds_baths_range"] ?? "Beds and baths"}
            </Text>
            <Box className="mb-4 flex-row gap-2">
              <Box className="flex-1">
                <Input
                  placeholder="Min beds"
                  value={
                    formData.preferred_bedrooms != null ? String(formData.preferred_bedrooms) : ""
                  }
                  onChangeText={(v) =>
                    update("preferred_bedrooms", parseInt(v.replace(/\D/g, ""), 10) || undefined)
                  }
                  keyboardType="numeric"
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
              </Box>
              <Box className="flex-1">
                <Input
                  placeholder="Max beds"
                  value={
                    formData.preferred_bedrooms_max != null
                      ? String(formData.preferred_bedrooms_max)
                      : ""
                  }
                  onChangeText={(v) => {
                    const n = parseInt(v.replace(/\D/g, ""), 10);
                    update("preferred_bedrooms_max", Number.isFinite(n) ? n : undefined);
                  }}
                  keyboardType="numeric"
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
              </Box>
            </Box>
            <Box className="mb-4 flex-row gap-2">
              <Box className="flex-1">
                <Input
                  placeholder="Min baths"
                  value={
                    formData.preferred_bathrooms != null ? String(formData.preferred_bathrooms) : ""
                  }
                  onChangeText={(v) =>
                    update("preferred_bathrooms", parseInt(v.replace(/\D/g, ""), 10) || undefined)
                  }
                  keyboardType="numeric"
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
              </Box>
              <Box className="flex-1">
                <Input
                  placeholder="Max baths"
                  value={
                    formData.preferred_bathrooms_max != null
                      ? String(formData.preferred_bathrooms_max)
                      : ""
                  }
                  onChangeText={(v) => {
                    const n = parseInt(v.replace(/\D/g, ""), 10);
                    update("preferred_bathrooms_max", Number.isFinite(n) ? n : undefined);
                  }}
                  keyboardType="numeric"
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
              </Box>
            </Box>
            <Box className="mt-2">
              <Text className="mb-1 text-xs font-medium text-gray-500">
                Housing type and other preferences
              </Text>
              <Box className="mb-3">
                <Text className="mb-1 text-xs text-gray-600">Home type</Text>
                <Box className="flex-row flex-wrap gap-2">
                  {["single_family", "townhouse", "condo", "multi_family"].map((value) => {
                    const current = (formData.preferred_housing_type as string) ?? "";
                    const parts = current.split(",").filter(Boolean);
                    const isSelected = parts.includes(value);
                    const next = isSelected ? parts.filter((v) => v !== value) : [...parts, value];
                    const label =
                      value === "single_family"
                        ? "Single family"
                        : value === "townhouse"
                          ? "Townhouse"
                          : value === "condo"
                            ? "Condo"
                            : "Multi-family";
                    return (
                      <Pressable
                        key={value}
                        onPress={() =>
                          update("preferred_housing_type", next.length ? next.join(",") : undefined)
                        }
                        className={`rounded-full border px-3 py-1.5 ${
                          isSelected
                            ? "border-brand-accent bg-brand-accent/10"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            isSelected ? "text-brand-accent" : "text-gray-700"
                          }`}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </Box>
              </Box>
              <Box className="mb-3 flex-row gap-2">
                <Box className="flex-1">
                  <Text className="mb-1 text-xs text-gray-600">Lot size</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 2 }}
                  >
                    {LOT_SIZE_OPTIONS.map((opt) => {
                      const isSelected = formData.preferred_lot_size === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() =>
                            update(
                              "preferred_lot_size",
                              isSelected ? undefined : (opt.value as unknown as string)
                            )
                          }
                          className={`mr-2 rounded-full border px-3 py-1.5 ${
                            isSelected
                              ? "border-brand-accent bg-brand-accent/10"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              isSelected ? "text-brand-accent" : "text-gray-700"
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Box>
              </Box>
              <Box className="mb-3 flex-row gap-2">
                <Box className="flex-1">
                  <Text className="mb-1 text-xs text-gray-600">Home age</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 2 }}
                  >
                    {HOME_AGE_OPTIONS.map((opt) => {
                      const isSelected = formData.preferred_home_age === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() =>
                            update(
                              "preferred_home_age",
                              isSelected ? undefined : (opt.value as unknown as string)
                            )
                          }
                          className={`mr-2 rounded-full border px-3 py-1.5 ${
                            isSelected
                              ? "border-brand-accent bg-brand-accent/10"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              isSelected ? "text-brand-accent" : "text-gray-700"
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Box>
              </Box>
              <Box className="mb-3 flex-row gap-2">
                <Box className="flex-1">
                  <Text className="mb-1 text-xs text-gray-600">Architectural style</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 2 }}
                  >
                    {ARCHITECTURAL_STYLE_OPTIONS.map((opt) => {
                      const isSelected = formData.preferred_architectural_style === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() =>
                            update(
                              "preferred_architectural_style",
                              isSelected ? undefined : (opt.value as unknown as string)
                            )
                          }
                          className={`mr-2 rounded-full border px-3 py-1.5 ${
                            isSelected
                              ? "border-brand-accent bg-brand-accent/10"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              isSelected ? "text-brand-accent" : "text-gray-700"
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Box>
              </Box>
              <Box className="mb-3 flex-row gap-2">
                <Box className="flex-1">
                  <Text className="mb-1 text-xs text-gray-600">Renovation preference</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 2 }}
                  >
                    {RENOVATION_OPTIONS.map((opt) => {
                      const isSelected = formData.renovation_preference === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() =>
                            update(
                              "renovation_preference",
                              isSelected ? undefined : (opt.value as unknown as string)
                            )
                          }
                          className={`mr-2 rounded-full border px-3 py-1.5 ${
                            isSelected
                              ? "border-brand-accent bg-brand-accent/10"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              isSelected ? "text-brand-accent" : "text-gray-700"
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Box>
              </Box>
              <Box className="mb-3 flex-row gap-2">
                <Box className="flex-1">
                  <Text className="mb-1 text-xs text-gray-600">Intended property use</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 2 }}
                  >
                    {PROPERTY_USE_OPTIONS.map((opt) => {
                      const isSelected = formData.intended_property_use === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() =>
                            update(
                              "intended_property_use",
                              isSelected ? undefined : (opt.value as unknown as string)
                            )
                          }
                          className={`mr-2 rounded-full border px-3 py-1.5 ${
                            isSelected
                              ? "border-brand-accent bg-brand-accent/10"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              isSelected ? "text-brand-accent" : "text-gray-700"
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Box>
              </Box>
              <Box className="mb-4 flex-row gap-2">
                <Box className="flex-1">
                  <Text className="mb-1 text-xs text-gray-600">Walkability importance</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 2 }}
                  >
                    {WALKABILITY_OPTIONS.map((opt) => {
                      const isSelected = formData.walkability_importance === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() =>
                            update(
                              "walkability_importance",
                              isSelected ? undefined : (opt.value as unknown as string)
                            )
                          }
                          className={`mr-2 rounded-full border px-3 py-1.5 ${
                            isSelected
                              ? "border-brand-accent bg-brand-accent/10"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              isSelected ? "text-brand-accent" : "text-gray-700"
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Box>
              </Box>
              <Text className="text-xs text-gray-500">
                Important locations are managed in Profile. Search uses your saved locations to find
                homes.
              </Text>
            </Box>
          </ScrollView>
          <Box className="border-t border-gray-200 px-4 py-3">
            <Button
              variant="primary"
              size="md"
              onPress={handleApply}
              loading={saving}
              className="w-full"
            >
              {SEARCH_TRANSLATIONS["search.apply"] ?? "Apply"}
            </Button>
          </Box>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: color("neutral.50"),
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "75%",
  },
  scroll: {
    maxHeight: 400,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
});
