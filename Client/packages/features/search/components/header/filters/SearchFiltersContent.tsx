import React from "react";

import Input from "@ui/form/Input";

import { spacing } from "packages/design-tokens";
import {
  ImportantLocationsInput,
  LotSizeAndHomeAgeSliders,
  type LotSizeHomeAgeSearchOverridesPatch,
  MUST_HAVE_OPTIONS,
} from "packages/features/profile";
import { SearchStrictPreferencesControlNative } from "packages/features/search/components/filters/SearchStrictPreferencesControl.native";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import {
  ARCHITECTURAL_STYLE_OPTIONS,
  PROPERTY_USE_OPTIONS,
  RENOVATION_PREFERENCE_OPTIONS,
  WALKABILITY_OPTIONS,
} from "packages/features/search/types/otherFilterOptions";
import type { SearchFiltersFormData } from "packages/features/search/types/searchFiltersForm";
import { ClientSelector } from "packages/ui";
import { ScrollView } from "packages/ui/components/structure/primitives";
import { Box } from "packages/ui/components/structure/primitives";
import { Text } from "packages/ui/components/structure/primitives";
import { Pressable } from "packages/ui/components/structure/primitives";
import Title from "packages/ui/components/structure/text/Title";

import { FilterChipRow } from "./FilterChipRow";

type SearchFiltersContentProps = {
  formData: Partial<SearchFiltersFormData>;
  update: (field: keyof SearchFiltersFormData, value: unknown) => void;
  onSearchFilterOverridesPatch?: (patch: LotSizeHomeAgeSearchOverridesPatch) => void;
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
  /** Appended inside the scroll area (e.g. native display controls from SearchFiltersSheet) */
  trailingSlot?: React.ReactNode;
};

const HOUSING_TYPE_LABELS: Record<string, string> = {
  single_family: "Single family",
  townhouse: "Townhouse",
  condo: "Condo",
  multi_family: "Multi-family",
};

function spacingToNum(token: string): number {
  const m = token.match(/^([\d.]+)rem$/);
  return m ? parseFloat(m[1]) * 16 : 0;
}

export function SearchFiltersContent({
  formData,
  update,
  onSearchFilterOverridesPatch,
  selectedClientId,
  onClientChange,
  trailingSlot,
}: SearchFiltersContentProps) {
  const importantLocations = Array.isArray(formData.important_locations)
    ? formData.important_locations
    : [];

  return (
    <ScrollView
      style={{ maxHeight: spacingToNum(spacing(100)) }}
      contentContainerStyle={{
        padding: spacingToNum(spacing(4)),
        paddingBottom: spacingToNum(spacing(6)),
      }}
    >
      {selectedClientId !== undefined && onClientChange ? (
        <Box className="mb-4">
          <ClientSelector selectedClientId={selectedClientId} onClientChange={onClientChange} />
        </Box>
      ) : null}
      <Text className="text-text-secondary mb-2 text-xs font-medium">
        {SEARCH_TRANSLATIONS["search.location_preferences"] ?? "Location preferences"}
      </Text>
      <Box className="mb-4">
        <ImportantLocationsInput
          locations={importantLocations}
          onChange={(locs) => update("important_locations", locs)}
          isEditMode
        />
      </Box>
      <Box className="mb-4 flex-row gap-2">
        <Box className="flex-1">
          <Input
            placeholder="Min price"
            value={formData.home_budget_min != null ? String(formData.home_budget_min) : ""}
            onValueChange={(v) =>
              update("home_budget_min", parseInt((v ?? "").replace(/\D/g, ""), 10) || undefined)
            }
            keyboardType="numeric"
            className="border-border bg-background-surface rounded-lg border px-3 py-2 text-sm"
          />
        </Box>
        <Box className="flex-1">
          <Input
            placeholder="Max price"
            value={formData.home_budget_max != null ? String(formData.home_budget_max) : ""}
            onValueChange={(v) =>
              update("home_budget_max", parseInt((v ?? "").replace(/\D/g, ""), 10) || undefined)
            }
            keyboardType="numeric"
            className="border-border bg-background-surface rounded-lg border px-3 py-2 text-sm"
          />
        </Box>
      </Box>

      <Text className="text-text-secondary mb-1 text-xs font-medium">
        {SEARCH_TRANSLATIONS["search.filters_beds_baths_range"] ?? "Beds and baths"}
      </Text>
      <Box className="mb-4 flex-row gap-2">
        <Box className="flex-1">
          <Input
            placeholder="Min bedrooms"
            value={
              formData.preferred_bedrooms_min != null ? String(formData.preferred_bedrooms_min) : ""
            }
            onValueChange={(v) =>
              update(
                "preferred_bedrooms_min",
                parseInt((v ?? "").replace(/\D/g, ""), 10) || undefined
              )
            }
            keyboardType="numeric"
            className="border-border bg-background-surface rounded-lg border px-3 py-2 text-sm"
          />
        </Box>
        <Box className="flex-1">
          <Input
            placeholder="Max bedrooms"
            value={
              formData.preferred_bedrooms_max != null ? String(formData.preferred_bedrooms_max) : ""
            }
            onValueChange={(v) => {
              const n = parseInt((v ?? "").replace(/\D/g, ""), 10);
              update("preferred_bedrooms_max", Number.isFinite(n) ? n : undefined);
            }}
            keyboardType="numeric"
            className="border-border bg-background-surface rounded-lg border px-3 py-2 text-sm"
          />
        </Box>
      </Box>
      <Box className="mb-4 flex-row gap-2">
        <Box className="flex-1">
          <Input
            placeholder="Min bathrooms"
            value={
              formData.preferred_bathrooms_min != null
                ? String(formData.preferred_bathrooms_min)
                : ""
            }
            onValueChange={(v) =>
              update(
                "preferred_bathrooms_min",
                parseInt((v ?? "").replace(/\D/g, ""), 10) || undefined
              )
            }
            keyboardType="numeric"
            className="border-border bg-background-surface rounded-lg border px-3 py-2 text-sm"
          />
        </Box>
        <Box className="flex-1">
          <Input
            placeholder="Max bathrooms"
            value={
              formData.preferred_bathrooms_max != null
                ? String(formData.preferred_bathrooms_max)
                : ""
            }
            onValueChange={(v) => {
              const n = parseInt((v ?? "").replace(/\D/g, ""), 10);
              update("preferred_bathrooms_max", Number.isFinite(n) ? n : undefined);
            }}
            keyboardType="numeric"
            className="border-border bg-background-surface rounded-lg border px-3 py-2 text-sm"
          />
        </Box>
      </Box>

      <Text className="text-text-secondary mb-1 text-xs font-medium">
        {SEARCH_TRANSLATIONS["search.must_have_features"] ?? "Must-have features"}
      </Text>
      <Text className="text-text-tertiary mb-2 text-xs">
        {SEARCH_TRANSLATIONS["search.must_have_features_hint"] ??
          "Every home in your results must include all of these."}
      </Text>
      <Box className="mb-4 flex-row flex-wrap gap-2">
        {MUST_HAVE_OPTIONS.map((opt) => {
          const selected = new Set(Array.isArray(formData.must_have) ? formData.must_have : []);
          const isSelected = selected.has(opt.value);
          const next = isSelected
            ? [...selected].filter((v) => v !== opt.value)
            : [...selected, opt.value];
          return (
            <Pressable
              key={opt.value}
              onPress={() => update("must_have", next)}
              className={`rounded-full border px-3 py-1.5 ${
                isSelected
                  ? "border-border bg-primary-muted"
                  : "border-border bg-background-surface"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  isSelected ? "text-primary" : "text-text-secondary"
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </Box>

      <Text className="text-text-secondary mb-1 text-xs font-medium">
        {SEARCH_TRANSLATIONS["search.preferred_features_ranking"] ??
          "Features that boost match score"}
      </Text>
      <Text className="text-text-tertiary mb-2 text-xs">
        {SEARCH_TRANSLATIONS["search.preferred_features_hint"] ??
          "Optional. Comma-separated phrases we look for in listings."}
      </Text>
      <Box className="mb-4">
        <Input
          placeholder="e.g. walk-in closet, hardwood floors"
          value={(formData.preferred_home_features ?? []).join(", ")}
          onValueChange={(v) =>
            update(
              "preferred_home_features",
              (v ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          className="border-border bg-background-surface rounded-lg border px-3 py-2 text-sm"
        />
      </Box>

      <Box className="mt-2">
        <Text className="text-text-secondary mb-1 text-xs font-medium">
          Housing type and other preferences
        </Text>
        <Box className="mb-3">
          <Text className="text-text-secondary mb-1 text-xs">Home type</Text>
          <Box className="flex-row flex-wrap gap-2">
            {["single_family", "townhouse", "condo", "multi_family"].map((value) => {
              const current = (formData.preferred_housing_type as string) ?? "";
              const parts = current.split(",").filter(Boolean);
              const isSelected = parts.includes(value);
              const next = isSelected ? parts.filter((v) => v !== value) : [...parts, value];
              const label = HOUSING_TYPE_LABELS[value] ?? value;
              return (
                <Pressable
                  key={value}
                  onPress={() =>
                    update("preferred_housing_type", next.length ? next.join(",") : undefined)
                  }
                  className={`rounded-full border px-3 py-1.5 ${
                    isSelected
                      ? "border-border bg-primary-muted"
                      : "border-border bg-background-surface"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      isSelected ? "text-primary" : "text-text-secondary"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </Box>
        </Box>

        <Box className="mb-4">
          <LotSizeAndHomeAgeSliders
            formData={formData}
            updateFormData={(field, value) => update(field as keyof SearchFiltersFormData, value)}
            onSearchFilterOverridesPatch={onSearchFilterOverridesPatch}
            layout="responsive-row"
          />
        </Box>
        <FilterChipRow
          label="Architectural style"
          options={ARCHITECTURAL_STYLE_OPTIONS}
          value={formData.preferred_architectural_style}
          onChange={(v) => update("preferred_architectural_style", v)}
        />
        <FilterChipRow
          label="Renovation preference"
          options={RENOVATION_PREFERENCE_OPTIONS}
          value={formData.renovation_preference}
          onChange={(v) => update("renovation_preference", v)}
        />
        <FilterChipRow
          label="Intended property use"
          options={PROPERTY_USE_OPTIONS}
          value={formData.intended_property_use}
          onChange={(v) => update("intended_property_use", v)}
        />
        <FilterChipRow
          label="Walkability importance"
          options={WALKABILITY_OPTIONS}
          value={formData.walkability_importance}
          onChange={(v) => update("walkability_importance", v)}
          className="mb-4"
        />
      </Box>

      <SearchStrictPreferencesControlNative />

      {trailingSlot ? (
        <Box className="border-border mt-4 border-t pt-6">
          <Title as="h3" size="sm" className="mb-4">
            {SEARCH_TRANSLATIONS["search.display"] ?? "Display"}
          </Title>
          {trailingSlot}
        </Box>
      ) : null}
    </ScrollView>
  );
}
