import React, { useCallback, useEffect, useState } from "react";

import { useLocalization } from "packages/contexts";
import { ClearPreferencesButton } from "packages/features/search/components/filters/ClearPreferencesButton";
import { SearchDisplaySectionNative } from "packages/features/search/components/header/display/SearchDisplaySection.native";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import type { SearchFiltersFormData } from "packages/features/search/types/searchFiltersForm";
import { usePreferencesSubmit, useUserPreferences } from "packages/hooks/data/user/useUserData";
import { useIsAgent } from "packages/hooks/store";
import { useSearchContextStore } from "packages/store";
import { Button } from "packages/ui";
import { BaseModal } from "packages/ui/components/modals";
import { Box } from "packages/ui/components/primitives";

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
  const { t } = useLocalization();
  const isAgent = useIsAgent();
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const submitPreferences = usePreferencesSubmit();
  const setSearchFilterOverrides = useSearchContextStore((s) => s.setSearchFilterOverrides);

  const [formData, setFormData] = useState<Partial<SearchFiltersFormData>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!userPreferences) {
      setFormData({});
      return;
    }
    setFormData(preferencesToFormData(userPreferences as Record<string, unknown>));
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
        ...(formData.home_budget_min != null && {
          home_budget_min: formData.home_budget_min,
        }),
        ...(formData.home_budget_max != null && {
          home_budget_max: formData.home_budget_max,
        }),
        ...(formData.preferred_bedrooms_min != null && {
          preferred_bedrooms_min: formData.preferred_bedrooms_min,
        }),
        ...(formData.preferred_bedrooms_max != null && {
          preferred_bedrooms_max: formData.preferred_bedrooms_max,
        }),
        ...(formData.preferred_bathrooms_min != null && {
          preferred_bathrooms_min: formData.preferred_bathrooms_min,
        }),
        ...(formData.preferred_bathrooms_max != null && {
          preferred_bathrooms_max: formData.preferred_bathrooms_max,
        }),
        ...(formData.preferred_housing_type != null && {
          preferred_housing_type: formData.preferred_housing_type,
        }),
        ...(Array.isArray(formData.listing_type) && {
          listing_type: formData.listing_type,
        }),
        ...(formData.preferred_sqft_min != null && {
          preferred_sqft_min: formData.preferred_sqft_min,
        }),
        ...(formData.preferred_sqft_max != null && {
          preferred_sqft_max: formData.preferred_sqft_max,
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

  const handleAfterClear = useCallback(async () => {
    await refreshUserPreferences();
    await Promise.resolve(onApply());
  }, [onApply, refreshUserPreferences]);

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
          label={t("search.apply")}
        >
          {SEARCH_TRANSLATIONS["search.apply"] ?? "Apply"}
        </Button>
      }
    >
      {isAgent ? (
        <Box className="border-border mb-4 border-b pb-4">
          <ClearPreferencesButton
            selectedClientId={selectedClientId}
            onClientChange={onClientChange}
            replaceFormData={(next) => setFormData(next as Partial<SearchFiltersFormData>)}
            onAfterClear={handleAfterClear}
            className="w-full"
          />
        </Box>
      ) : null}
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
