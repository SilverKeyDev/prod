import React, { useCallback, useEffect, useState } from "react";

import { SearchDisplaySectionNative } from "packages/features/search/components/header/display/SearchDisplaySection.native";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import type { SearchFiltersFormData } from "packages/features/search/types/searchFiltersForm";
import { usePreferencesSubmit, useUserPreferences } from "packages/hooks/data/user/useUserData";
import { useSearchContextStore } from "packages/store";
import { Button } from "packages/ui";
import { BaseModal } from "packages/ui/components/modals";

import { SearchFiltersContent } from "./SearchFiltersContent";

export type SearchFiltersSheetProps = {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
};

function preferencesToFormData(
  prefs: Record<string, unknown> | null
): Partial<SearchFiltersFormData> {
  if (!prefs) return {};
  const base = { ...prefs } as Partial<SearchFiltersFormData>;
  if (base.preferred_bedrooms_min == null && typeof prefs.preferred_bedrooms === "number") {
    base.preferred_bedrooms_min = prefs.preferred_bedrooms;
  }
  if (base.preferred_bathrooms_min == null && typeof prefs.preferred_bathrooms === "number") {
    base.preferred_bathrooms_min = prefs.preferred_bathrooms;
  }
  return base;
}

export function SearchFiltersSheet({
  open,
  onClose,
  onApply,
  selectedClientId,
  onClientChange,
}: SearchFiltersSheetProps): React.ReactElement {
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const submitPreferences = usePreferencesSubmit();
  const setSearchFilterOverrides = useSearchContextStore((s) => s.setSearchFilterOverrides);

  const [formData, setFormData] = useState<Partial<SearchFiltersFormData>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && userPreferences) {
      setFormData(preferencesToFormData(userPreferences as Record<string, unknown>));
    }
  }, [open, userPreferences]);

  const update = useCallback((field: keyof SearchFiltersFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApply = useCallback(async () => {
    setSaving(true);
    try {
      await submitPreferences(formData as Record<string, unknown>);
      setSearchFilterOverrides((prev) => ({
        ...prev,
        ...(formData.preferred_bedrooms_max != null && {
          preferred_bedrooms_max: formData.preferred_bedrooms_max,
        }),
        ...(formData.preferred_bathrooms_max != null && {
          preferred_bathrooms_max: formData.preferred_bathrooms_max,
        }),
        ...(formData.preferred_lot_size_min != null && {
          preferred_lot_size_min: formData.preferred_lot_size_min,
        }),
        ...(formData.preferred_lot_size_max != null && {
          preferred_lot_size_max: formData.preferred_lot_size_max,
        }),
        ...(formData.preferred_home_age_min != null && {
          preferred_home_age_min: formData.preferred_home_age_min,
        }),
        ...(formData.preferred_home_age_max != null && {
          preferred_home_age_max: formData.preferred_home_age_max,
        }),
      }));
      await refreshUserPreferences();
      await Promise.resolve(onApply());
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
    <BaseModal
      isOpen={open}
      onClose={onClose}
      title={SEARCH_TRANSLATIONS["search.filters"] ?? "Filters"}
      showCloseButton
      closeOnBackdropClick
      footerContent={
        <Button
          variant="primary"
          size="md"
          onPress={handleApply}
          loading={saving}
          className="w-full"
          iconName="check"
        >
          {SEARCH_TRANSLATIONS["search.apply"] ?? "Apply"}
        </Button>
      }
    >
      <SearchFiltersContent
        formData={formData}
        update={update}
        onSearchFilterOverridesPatch={(patch) =>
          setSearchFilterOverrides((prev) => ({ ...prev, ...patch }))
        }
        selectedClientId={selectedClientId}
        onClientChange={onClientChange}
        trailingSlot={<SearchDisplaySectionNative />}
      />
    </BaseModal>
  );
}
