import React from "react";

import Input from "@ui/form/Input";

import { spacing } from "packages/design-tokens";
import {
  ARCHITECTURAL_STYLE_OPTIONS,
  HOME_AGE_OPTIONS,
  LOT_SIZE_OPTIONS,
  PROPERTY_USE_OPTIONS,
  RENOVATION_OPTIONS,
  WALKABILITY_OPTIONS,
} from "packages/features/search/types/otherFilterOptions";
import type { SearchFiltersFormData } from "packages/features/search/types/searchFiltersForm";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { ScrollView } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { Pressable } from "packages/ui/components/primitives";

import { FilterChipRow } from "./FilterChipRow";

type SearchFiltersContentProps = {
  formData: Partial<SearchFiltersFormData>;
  update: (field: keyof SearchFiltersFormData, value: unknown) => void;
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

export function SearchFiltersContent({ formData, update }: SearchFiltersContentProps) {
  return (
    <ScrollView
      style={{ maxHeight: spacingToNum(spacing(100)) }}
      contentContainerStyle={{
        padding: spacingToNum(spacing(4)),
        paddingBottom: spacingToNum(spacing(6)),
      }}
    >
      <Box className="mb-4 flex-row gap-2">
        <Box className="flex-1">
          <Input
            placeholder="Min $"
            value={formData.home_budget_min != null ? String(formData.home_budget_min) : ""}
            onValueChange={(v) =>
              update("home_budget_min", parseInt((v ?? "").replace(/\D/g, ""), 10) || undefined)
            }
            keyboardType="numeric"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
        </Box>
        <Box className="flex-1">
          <Input
            placeholder="Max $"
            value={formData.home_budget_max != null ? String(formData.home_budget_max) : ""}
            onValueChange={(v) =>
              update("home_budget_max", parseInt((v ?? "").replace(/\D/g, ""), 10) || undefined)
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
            value={formData.preferred_bedrooms != null ? String(formData.preferred_bedrooms) : ""}
            onValueChange={(v) =>
              update("preferred_bedrooms", parseInt((v ?? "").replace(/\D/g, ""), 10) || undefined)
            }
            keyboardType="numeric"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
        </Box>
        <Box className="flex-1">
          <Input
            placeholder="Max beds"
            value={
              formData.preferred_bedrooms_max != null ? String(formData.preferred_bedrooms_max) : ""
            }
            onValueChange={(v) => {
              const n = parseInt((v ?? "").replace(/\D/g, ""), 10);
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
            value={formData.preferred_bathrooms != null ? String(formData.preferred_bathrooms) : ""}
            onValueChange={(v) =>
              update("preferred_bathrooms", parseInt((v ?? "").replace(/\D/g, ""), 10) || undefined)
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
            onValueChange={(v) => {
              const n = parseInt((v ?? "").replace(/\D/g, ""), 10);
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
              const label = HOUSING_TYPE_LABELS[value] ?? value;
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

        <FilterChipRow
          label="Lot size"
          options={LOT_SIZE_OPTIONS}
          value={formData.preferred_lot_size}
          onChange={(v) => update("preferred_lot_size", v)}
        />
        <FilterChipRow
          label="Home age"
          options={HOME_AGE_OPTIONS}
          value={formData.preferred_home_age}
          onChange={(v) => update("preferred_home_age", v)}
        />
        <FilterChipRow
          label="Architectural style"
          options={ARCHITECTURAL_STYLE_OPTIONS}
          value={formData.preferred_architectural_style}
          onChange={(v) => update("preferred_architectural_style", v)}
        />
        <FilterChipRow
          label="Renovation preference"
          options={RENOVATION_OPTIONS}
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
        <Text className="text-xs text-gray-500">
          Important locations are managed in Profile. Search uses your saved locations to find
          homes.
        </Text>
      </Box>
    </ScrollView>
  );
}
