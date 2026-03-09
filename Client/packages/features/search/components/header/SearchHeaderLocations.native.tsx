import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Input from "@ui/form/Input";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { useUserPreferences } from "packages/hooks/data/useUserData";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import CloseButton from "packages/ui/components/button/CloseButton";
import { ScrollView } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";
import { MOBILE_TEXT_INPUT_CLASS } from "packages/ui/styles/nativeFormStyles.native";

/** Same schema as user preferences important_locations (web source of truth). */
type SearchImportantLocation = {
  address: string;
  commute_tolerance?: number;
};

const MAX_VISIBLE = 3;
const ADDRESS_MAX_LENGTH = 28;
const LOCATION_SAVE_DEBOUNCE_MS = 400;

function truncateAddress(address: string): string {
  if (address.length <= ADDRESS_MAX_LENGTH) return address;
  return `${address.slice(0, ADDRESS_MAX_LENGTH - 3)}...`;
}

export type SearchHeaderLocationsNativeProps = {
  /** Called after locations are saved (e.g. refresh isochrone) */
  onPreferencesChanged?: () => void | Promise<void>;
  /** When true, trigger does not use flex-1 (for use as right side of criteria bar). */
  compact?: boolean;
};

export function SearchHeaderLocationsNative({
  onPreferencesChanged,
  compact = false,
}: SearchHeaderLocationsNativeProps): React.ReactElement {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [localLocations, setLocalLocations] = useState<SearchImportantLocation[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { userPreferences, updatePreferences } = useUserPreferences();

  const locations = userPreferences?.important_locations as
    | SearchImportantLocation[]
    | undefined
    | null;
  const locationsList = Array.isArray(locations) ? locations : [];
  const hasLocations = locationsList.length > 0;

  useEffect(() => {
    if (sheetOpen) {
      setLocalLocations(Array.isArray(locations) ? [...locations] : []);
    }
  }, [sheetOpen, locations]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const updateFormData = useCallback(
    (_field: string | number | symbol, value: unknown) => {
      const next = Array.isArray(value) ? (value as SearchImportantLocation[]) : [];
      setLocalLocations(next);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        void updatePreferences({ important_locations: next })
          .then(() => onPreferencesChanged?.())
          .catch(() => {
            showErrorToast("Could not save locations. Please try again.");
          });
      }, LOCATION_SAVE_DEBOUNCE_MS);
    },
    [updatePreferences, onPreferencesChanged]
  );

  const handleOpenSheet = useCallback(() => setSheetOpen(true), []);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const toSave = localLocations ?? [];
    void updatePreferences({ important_locations: toSave })
      .then(() => onPreferencesChanged?.())
      .catch(() => {
        showErrorToast("Could not save locations. Please try again.");
      });
  }, [localLocations, updatePreferences, onPreferencesChanged]);

  const commuteLabel = (minutes: number): string =>
    (SEARCH_TRANSLATIONS["search.commute_min"] ?? "{{min}} min").replace(
      "{{min}}",
      String(minutes)
    );
  const moreLabel = (count: number): string =>
    (SEARCH_TRANSLATIONS["search.locations_more"] ?? "+{{count}} more").replace(
      "{{count}}",
      String(count)
    );

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
      const updated: SearchImportantLocation = { ...existing, address: trimmed };
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
      <Pressable
        onPress={handleOpenSheet}
        className={`flex-row items-center justify-between gap-2 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white/70 px-3 ${HEADER_ROW_HEIGHT} ${compact ? "shrink-0" : "min-w-0 flex-1"}`}
      >
        {hasLocations ? (
          <>
            {!compact && (
              <Box className="min-h-0 min-w-0 flex-1 flex-row flex-nowrap items-center gap-x-2 overflow-hidden">
                {locationsList.slice(0, MAX_VISIBLE).map((loc, i) => (
                  <Box
                    key={`${loc.address}-${loc.commute_tolerance ?? ""}-${i}`}
                    className="shrink-0 flex-row items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5"
                  >
                    <Text className="max-w-28 truncate text-xs text-gray-700" numberOfLines={1}>
                      {truncateAddress(loc.address)}
                    </Text>
                    {loc.commute_tolerance != null ? (
                      <Text className="shrink-0 text-xs text-gray-500" numberOfLines={1}>
                        {commuteLabel(loc.commute_tolerance)}
                      </Text>
                    ) : null}
                  </Box>
                ))}
                {locationsList.length > MAX_VISIBLE ? (
                  <Text className="shrink-0 text-xs text-gray-500">
                    {moreLabel(locationsList.length - MAX_VISIBLE)}
                  </Text>
                ) : null}
              </Box>
            )}
            <Text className="shrink-0 text-sm text-gray-400">
              {SEARCH_TRANSLATIONS["search.edit_locations"] ?? "Edit locations"}
            </Text>
          </>
        ) : (
          <>
            <Text className="text-sm text-gray-600">
              {SEARCH_TRANSLATIONS["search.add_location"] ?? "Add location"}
            </Text>
          </>
        )}
      </Pressable>
    );
  }

  return (
    <Modal visible={sheetOpen} animationType="slide" transparent onRequestClose={handleCloseSheet}>
      <Pressable style={styles.backdrop} onPress={handleCloseSheet}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Box className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
            <Text className="text-base font-semibold text-gray-900">
              {SEARCH_TRANSLATIONS["search.location_preferences"] ?? "Location preferences"}
            </Text>
            <CloseButton onPress={handleCloseSheet} size="sm" />
          </Box>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text className="mb-3 text-sm text-gray-600">
              {SEARCH_TRANSLATIONS["search.location_preferences_description"] ??
                "Add work, family, or other places. We'll use these to find homes that fit your life."}
            </Text>
            <Box className="gap-4">
              {displayList.map((loc, index) => {
                const commuteText =
                  loc.commute_tolerance != null ? String(loc.commute_tolerance) : "";
                return (
                  <Box key={`loc-${index}`} className="gap-2">
                    <Text className="text-sm font-medium text-gray-700">
                      Location {displayList.length > 1 ? index + 1 : ""}
                    </Text>
                    <Box className="gap-2">
                      <Input
                        value={loc.address ?? ""}
                        onValueChange={(v) => handleAddressChange(index, v ?? "")}
                        placeholder="Address or city"
                        className={MOBILE_TEXT_INPUT_CLASS}
                      />
                      <Input
                        value={commuteText}
                        onValueChange={(v) => handleCommuteChange(index, v ?? "")}
                        placeholder="Commute max (minutes, optional)"
                        keyboardType="number-pad"
                        className={MOBILE_TEXT_INPUT_CLASS}
                      />
                    </Box>
                    {displayList.length > 1 && (
                      <Pressable
                        onPress={() => handleRemoveLocation(index)}
                        className="self-start rounded-lg border border-gray-200 bg-white px-3 py-2"
                      >
                        <Text className="text-sm font-medium text-red-600">Remove</Text>
                      </Pressable>
                    )}
                  </Box>
                );
              })}
              <Pressable
                onPress={handleAddLocation}
                className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-3"
              >
                <Text className="text-center text-sm font-medium text-gray-600">
                  Add another location
                </Text>
              </Pressable>
            </Box>
          </ScrollView>
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
