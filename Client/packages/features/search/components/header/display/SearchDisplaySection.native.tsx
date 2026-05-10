import React, { useCallback } from "react";

import { Pressable, StyleSheet, Switch } from "react-native";

import { color } from "packages/design-tokens";
import { useSearchDisplaySettings } from "packages/features/search/hooks/data/useSearchDisplaySettings";
import { useFiltersStore } from "packages/features/search/store/filters.slice";
import {
  RESULTS_ORDER_BY_OPTIONS,
  type ResultsOrderBy,
  type ResultsSortDirection,
} from "packages/features/search/types/searchDisplay";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { useAuthStore } from "packages/store";
import { Box, Text } from "packages/ui/components/primitives";

const ORDER_LABELS: Record<ResultsOrderBy, string> = {
  match_score: SEARCH_TRANSLATIONS["search.order_match_score"] ?? "Match score",
  price: SEARCH_TRANSLATIONS["search.order_price"] ?? "Price",
  distance: SEARCH_TRANSLATIONS["search.order_distance"] ?? "Distance",
  bedrooms: SEARCH_TRANSLATIONS["search.order_bedrooms"] ?? "Bedrooms",
  bathrooms: SEARCH_TRANSLATIONS["search.order_bathrooms"] ?? "Bathrooms",
  lot_size: SEARCH_TRANSLATIONS["search.order_lot_size"] ?? "Lot size",
  home_age: SEARCH_TRANSLATIONS["search.order_home_age"] ?? "Home age",
};

export function SearchDisplaySectionNative(): React.ReactElement {
  const authReady = useAuthStore((s) => s.authReady);
  const { patchSearchDisplay } = useSearchDisplaySettings(authReady);

  const showCommuteOverlay = useFiltersStore((s) => s.showCommuteOverlay);
  const setShowCommuteOverlay = useFiltersStore((s) => s.setShowCommuteOverlay);
  const resultsOrderBy = useFiltersStore((s) => s.resultsOrderBy);
  const setResultsOrderBy = useFiltersStore((s) => s.setResultsOrderBy);
  const resultsSortDirection = useFiltersStore((s) => s.resultsSortDirection);
  const setResultsSortDirection = useFiltersStore((s) => s.setResultsSortDirection);
  const preferencesStrictFilter = useFiltersStore((s) => s.preferencesStrictFilter);
  const setPreferencesStrictFilter = useFiltersStore((s) => s.setPreferencesStrictFilter);

  const onCommute = useCallback(
    (v: boolean) => {
      setShowCommuteOverlay(v);
      patchSearchDisplay({ show_commute_overlay: v });
    },
    [setShowCommuteOverlay, patchSearchDisplay]
  );

  const onStrictPreferences = useCallback(
    (v: boolean) => {
      setPreferencesStrictFilter(v);
      patchSearchDisplay({ preferences_strict_filter: v });
    },
    [setPreferencesStrictFilter, patchSearchDisplay]
  );

  return (
    <Box>
      <Text className="text-text-secondary mb-2 text-xs font-medium uppercase">
        {SEARCH_TRANSLATIONS["search.display_order_by"] ?? "Order by"}
      </Text>
      <Box className="mt-1 gap-1">
        {RESULTS_ORDER_BY_OPTIONS.map((key) => (
          <Pressable
            key={key}
            onPress={() => {
              setResultsOrderBy(key);
              patchSearchDisplay({ results_order_by: key });
            }}
            style={[styles.orderRow, resultsOrderBy === key && styles.orderRowActive]}
          >
            <Text
              className={
                resultsOrderBy === key
                  ? "text-text-primary text-sm font-medium"
                  : "text-text-secondary text-sm"
              }
            >
              {ORDER_LABELS[key]}
            </Text>
          </Pressable>
        ))}
      </Box>
      <Text className="text-text-secondary mt-6 text-xs font-medium uppercase">
        {SEARCH_TRANSLATIONS["search.display_sort_direction"] ?? "Sort direction"}
      </Text>
      <Box className="mt-2 flex-row flex-wrap gap-2">
        {(
          [
            ["asc", SEARCH_TRANSLATIONS["search.sort_low_to_high"] ?? "Low to high"],
            ["desc", SEARCH_TRANSLATIONS["search.sort_high_to_low"] ?? "High to low"],
          ] as const satisfies ReadonlyArray<readonly [ResultsSortDirection, string]>
        ).map(([dir, dirLabel]) => (
          <Pressable
            key={dir}
            onPress={() => {
              setResultsSortDirection(dir);
            }}
            style={[styles.chip, resultsSortDirection === dir && styles.chipActive]}
          >
            <Text
              className={
                resultsSortDirection === dir
                  ? "text-text-primary text-sm font-medium"
                  : "text-text-secondary text-sm"
              }
            >
              {dirLabel}
            </Text>
          </Pressable>
        ))}
      </Box>
      <Box style={[styles.row, styles.sectionTop]}>
        <Text className="text-text-primary flex-1 text-sm">
          {SEARCH_TRANSLATIONS["search.show_commute_area"] ?? "Show commute area"}
        </Text>
        <Switch value={showCommuteOverlay} onValueChange={onCommute} />
      </Box>
      <Text className="text-text-secondary mt-1 px-0 text-xs leading-snug">
        {SEARCH_TRANSLATIONS["search.show_commute_area_hint"] ??
          "For searches from your profile (important locations). Shows drive-time areas when on, or a simple bounds around those places when off. Map-only searches use the place or area you picked instead."}
      </Text>
      <Box style={styles.row}>
        <Text className="text-text-primary flex-1 pr-2 text-sm">
          {SEARCH_TRANSLATIONS["search.strict_preferences"] ?? "Match all preferences strictly"}
        </Text>
        <Switch value={preferencesStrictFilter} onValueChange={onStrictPreferences} />
      </Box>
      <Text className="text-text-secondary mt-1 px-0 text-xs leading-snug">
        {SEARCH_TRANSLATIONS["search.strict_preferences_hint"] ??
          "When off, we only apply every preference filter when there are more than 100 homes in the search area."}
      </Text>
    </Box>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  sectionTop: {
    marginTop: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color("neutral.200"),
  },
  chipActive: {
    borderColor: color("olive.DEFAULT"),
    backgroundColor: color("neutral.100"),
  },
  orderRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  orderRowActive: {
    borderColor: color("olive.DEFAULT"),
    backgroundColor: color("neutral.100"),
  },
});
