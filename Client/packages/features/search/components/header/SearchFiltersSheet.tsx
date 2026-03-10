import React, { useCallback, useEffect, useState } from "react";

import type { SearchFiltersFormData } from "packages/features/search/types/searchFiltersForm";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { usePreferencesSubmit, useUserPreferences } from "packages/hooks/data/useUserData";
import { useSearchContextStore } from "packages/store";
import Button from "packages/ui/components/button/Button";
import { BaseModal } from "packages/ui/components/modals";

import { SearchFiltersContent } from "./SearchFiltersContent";

export type SearchFiltersSheetProps = {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
};

function preferencesToFormData(
  prefs: Record<string, unknown> | null
): Partial<SearchFiltersFormData> {
  if (!prefs) return {};
  return { ...prefs } as Partial<SearchFiltersFormData>;
}

export function SearchFiltersSheet({
  open,
  onClose,
  onApply,
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
        >
          {SEARCH_TRANSLATIONS["search.apply"] ?? "Apply"}
        </Button>
      }
    >
      <SearchFiltersContent formData={formData} update={update} />
    </BaseModal>
  );
}
