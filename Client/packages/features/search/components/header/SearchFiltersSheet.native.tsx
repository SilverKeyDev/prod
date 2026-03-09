import React, { useCallback, useEffect, useState } from "react";

import { Modal, Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { usePreferencesSubmit, useUserPreferences } from "packages/hooks/data/useUserData";
import { useSearchContextStore } from "packages/store";
import Button from "packages/ui/components/button/Button";
import CloseButton from "packages/ui/components/button/CloseButton";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

import type { OnboardingData } from "@/features/profile/utils";

import { SearchFiltersContent } from "./SearchFiltersContent.native";

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
          <SearchFiltersContent formData={formData} update={update} />
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
});
