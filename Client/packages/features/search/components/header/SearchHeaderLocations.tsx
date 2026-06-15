import React, { useCallback, useEffect, useMemo } from "react";

import Input from "@ui/form/Input";

import { spacing } from "packages/design-tokens";
import { useSearchHeaderLocations } from "packages/features/search/hooks/ui/useSearchHeaderLocations";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { Box } from "packages/ui/components/structure/primitives";
import { Pressable } from "packages/ui/components/structure/primitives";
import { ScrollView } from "packages/ui/components/structure/primitives";
import { Text } from "packages/ui/components/structure/primitives";
import { BaseModal } from "packages/ui/components/surfaces/modals";

import { SearchHeaderLocationsTrigger } from "./SearchHeaderLocations/SearchHeaderLocationsTrigger";
import type { SearchImportantLocation } from "./SearchHeaderLocations/types";

function spacingToNum(token: string): number {
  const m = token.match(/^([\d.]+)rem$/);
  return m ? parseFloat(m[1]) * 16 : 0;
}

export type { SearchHeaderLocationsProps } from "./SearchHeaderLocations/types";

export function SearchHeaderLocations({
  onPreferencesChanged,
  compact = false,
}: {
  onPreferencesChanged?: () => void | Promise<void>;
  compact?: boolean;
}): React.ReactElement {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const {
    locations,
    locationsList,
    hasLocations,
    localLocations,
    updateFormData,
    syncLocalFromPreferences,
    saveAndClose,
  } = useSearchHeaderLocations(onPreferencesChanged);

  useEffect(() => {
    if (sheetOpen) {
      syncLocalFromPreferences(Array.isArray(locations) ? locations : []);
    }
  }, [sheetOpen, locations, syncLocalFromPreferences]);

  const handleOpenSheet = useCallback(() => setSheetOpen(true), []);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    saveAndClose();
  }, [saveAndClose]);

  const safeLocations = useMemo(
    () => (Array.isArray(localLocations) ? localLocations : []),
    [localLocations]
  );
  const displayList = useMemo(
    () => (safeLocations.length > 0 ? safeLocations : [{ address: "" }]),
    [safeLocations]
  );

  const handleAddressChange = useCallback(
    (index: number, address: string) => {
      const trimmed = address ?? "";
      const next = [...safeLocations];
      const existing = next[index] ?? { address: "" };
      const updated: SearchImportantLocation = {
        ...existing,
        address: trimmed,
      };
      if (next[index]) next[index] = updated;
      else next.push(updated);
      const filtered = next.filter((loc) => (loc.address ?? "").toString().trim().length > 0);
      updateFormData("important_locations", filtered);
    },
    [safeLocations, updateFormData]
  );

  const handleCommuteChange = useCallback(
    (index: number, minutesText: string) => {
      const text = minutesText.trim();
      const parsed = text === "" ? undefined : Number.parseInt(text, 10);
      const value = parsed === undefined || Number.isNaN(parsed) || parsed < 0 ? undefined : parsed;
      const next = [...safeLocations];
      const existing = next[index] ?? { address: "" };
      const updated: SearchImportantLocation = {
        ...existing,
        commute_tolerance: value,
      };
      if (next[index]) next[index] = updated;
      else next.push(updated);
      const filtered = next.filter((loc) => (loc.address ?? "").toString().trim().length > 0);
      updateFormData("important_locations", filtered);
    },
    [safeLocations, updateFormData]
  );

  const handleAddLocation = useCallback(() => {
    updateFormData("important_locations", [
      ...safeLocations,
      {
        address: "",
        commute_tolerance: safeLocations[0]?.commute_tolerance,
      },
    ]);
  }, [safeLocations, updateFormData]);

  const handleRemoveLocation = useCallback(
    (index: number) => {
      const next = safeLocations.filter((_, i) => i !== index);
      updateFormData("important_locations", next);
    },
    [safeLocations, updateFormData]
  );

  if (!sheetOpen) {
    return (
      <SearchHeaderLocationsTrigger
        locationsList={locationsList}
        hasLocations={hasLocations}
        onPress={handleOpenSheet}
        compact={compact}
        expanded={sheetOpen}
      />
    );
  }

  return (
    <BaseModal
      isOpen={sheetOpen}
      onClose={handleCloseSheet}
      title={SEARCH_TRANSLATIONS["search.location_preferences"] ?? "Location preferences"}
      showCloseButton
      closeOnBackdropClick
    >
      <ScrollView
        style={{ maxHeight: spacingToNum(spacing(100)) }}
        contentContainerStyle={{
          padding: spacingToNum(spacing(4)),
          paddingBottom: spacingToNum(spacing(6)),
        }}
      >
        <Text className="text-text-secondary mb-3 text-sm">
          {SEARCH_TRANSLATIONS["search.location_preferences_description"] ??
            "Add work, family, or other places. We'll use these to find homes that fit your life."}
        </Text>
        <Box className="gap-4">
          {displayList.map((loc, index) => {
            const commuteText = loc.commute_tolerance != null ? String(loc.commute_tolerance) : "";
            return (
              <Box key={`loc-${index}`} className="gap-2">
                <Text className="text-text-secondary text-sm font-medium">
                  Location {displayList.length > 1 ? index + 1 : ""}
                </Text>
                <Box className="gap-2">
                  <Input
                    value={loc.address ?? ""}
                    onValueChange={(v) => handleAddressChange(index, v ?? "")}
                    placeholder="Address or city"
                    className="border-border bg-background-surface rounded-lg border px-3 py-2 text-sm"
                  />
                  <Input
                    value={commuteText}
                    onValueChange={(v) => handleCommuteChange(index, v ?? "")}
                    placeholder="Max commute time (minutes, optional)"
                    keyboardType="number-pad"
                    className="border-border bg-background-surface rounded-lg border px-3 py-2 text-sm"
                  />
                </Box>
                {safeLocations.length > 0 && (
                  <Pressable
                    onPress={() => handleRemoveLocation(index)}
                    className="border-border bg-background-surface self-start rounded-lg border px-3 py-2"
                  >
                    <Text className="text-sm font-medium text-red-600">Remove</Text>
                  </Pressable>
                )}
              </Box>
            );
          })}
          <Pressable
            onPress={handleAddLocation}
            className="border-border bg-background-base rounded-lg border-2 border-dashed py-3"
          >
            <Text className="text-text-secondary text-center text-sm font-medium">
              Add another location
            </Text>
          </Pressable>
        </Box>
      </ScrollView>
    </BaseModal>
  );
}
