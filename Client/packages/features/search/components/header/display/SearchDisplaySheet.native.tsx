import React, { useCallback } from "react";

import { Modal, Pressable, StyleSheet, Switch } from "react-native";

import { getEnv } from "packages/config/env";
import { color } from "packages/design-tokens";
import { useSearchDisplaySettings } from "packages/features/search/hooks/data/useSearchDisplaySettings";
import { useFiltersStore } from "packages/features/search/store/filters.slice";
import {
  MAP_HOME_CARDS_MAX,
  MAP_HOME_CARDS_MIN,
  RESULTS_ORDER_BY_OPTIONS,
  type ResultsOrderBy,
} from "packages/features/search/types/searchDisplay";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { useAuthStore } from "packages/store";
import { Box, ScrollView, Text } from "packages/ui/components/primitives";

const ORDER_LABELS: Record<ResultsOrderBy, string> = {
  match_score: SEARCH_TRANSLATIONS["search.order_match_score"] ?? "Match score",
  price: SEARCH_TRANSLATIONS["search.order_price"] ?? "Price",
  distance: SEARCH_TRANSLATIONS["search.order_distance"] ?? "Distance",
  bedrooms: SEARCH_TRANSLATIONS["search.order_bedrooms"] ?? "Bedrooms",
  bathrooms: SEARCH_TRANSLATIONS["search.order_bathrooms"] ?? "Bathrooms",
  lot_size: SEARCH_TRANSLATIONS["search.order_lot_size"] ?? "Lot size",
  home_age: SEARCH_TRANSLATIONS["search.order_home_age"] ?? "Home age",
};

export type SearchDisplaySheetNativeProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchDisplaySheetNative({
  open,
  onClose,
}: SearchDisplaySheetNativeProps): React.ReactElement {
  const authReady = useAuthStore((s) => s.authReady);
  const { patchSearchDisplay } = useSearchDisplaySettings(authReady);

  const showCommuteOverlay = useFiltersStore((s) => s.showCommuteOverlay);
  const setShowCommuteOverlay = useFiltersStore((s) => s.setShowCommuteOverlay);
  const mapHomeCardsCount = useFiltersStore((s) => s.mapHomeCardsCount);
  const setMapHomeCardsCount = useFiltersStore((s) => s.setMapHomeCardsCount);
  const resultsOrderBy = useFiltersStore((s) => s.resultsOrderBy);
  const setResultsOrderBy = useFiltersStore((s) => s.setResultsOrderBy);
  const preferencesStrictFilter = useFiltersStore(
    (s) => s.preferencesStrictFilter,
  );
  const setPreferencesStrictFilter = useFiltersStore(
    (s) => s.setPreferencesStrictFilter,
  );
  const hasSearched = useFiltersStore((s) => s.hasSearched);
  const showMapListingPreviews = useFiltersStore(
    (s) => s.showMapListingPreviews,
  );
  const setShowMapListingPreviews = useFiltersStore(
    (s) => s.setShowMapListingPreviews,
  );
  const isDev = getEnv().isDevelopment;

  const onCommute = useCallback(
    (v: boolean) => {
      setShowCommuteOverlay(v);
      patchSearchDisplay({ show_commute_overlay: v });
    },
    [setShowCommuteOverlay, patchSearchDisplay],
  );

  const onStrictPreferences = useCallback(
    (v: boolean) => {
      setPreferencesStrictFilter(v);
      patchSearchDisplay({ preferences_strict_filter: v });
    },
    [setPreferencesStrictFilter, patchSearchDisplay],
  );

  const title = SEARCH_TRANSLATIONS["search.display"] ?? "Display";

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text className="text-text-primary mb-3 text-lg font-semibold">
            {title}
          </Text>
          <ScrollView>
            <Box style={styles.row}>
              <Text className="text-text-primary flex-1 text-sm">
                {SEARCH_TRANSLATIONS["search.show_commute_area"] ??
                  "Show commute area"}
              </Text>
              <Switch value={showCommuteOverlay} onValueChange={onCommute} />
            </Box>
            <Box style={styles.row}>
              <Text className="text-text-primary flex-1 pr-2 text-sm">
                {SEARCH_TRANSLATIONS["search.strict_preferences"] ??
                  "Match all preferences strictly"}
              </Text>
              <Switch
                value={preferencesStrictFilter}
                onValueChange={onStrictPreferences}
              />
            </Box>
            <Text className="text-text-secondary mt-1 px-0 text-xs leading-snug">
              {SEARCH_TRANSLATIONS["search.strict_preferences_hint"] ??
                "When off, we only apply every preference filter when there are more than 100 homes in the search area."}
            </Text>
            {isDev ? (
              <>
                <Box style={styles.row}>
                  <Text className="text-text-primary flex-1 pr-2 text-sm">
                    {SEARCH_TRANSLATIONS["search.show_map_listing_previews"] ??
                      "Show listing previews on map (dev)"}
                  </Text>
                  <Switch
                    value={showMapListingPreviews}
                    disabled={!hasSearched}
                    onValueChange={(v) => {
                      if (hasSearched) setShowMapListingPreviews(v);
                    }}
                  />
                </Box>
                <Text className="text-text-secondary mt-1 px-0 text-xs leading-snug">
                  {SEARCH_TRANSLATIONS["search.show_map_listing_previews_hint"] ??
                    "Floating home cards on the map. Run a search first."}
                </Text>
              </>
            ) : null}
            <Text className="text-text-secondary mt-4 text-xs font-medium uppercase">
              {SEARCH_TRANSLATIONS["search.display_map_cards"] ??
                "Homes on map"}
            </Text>
            <Box className="mt-2 flex-row flex-wrap gap-2">
              {Array.from(
                { length: MAP_HOME_CARDS_MAX - MAP_HOME_CARDS_MIN + 1 },
                (_, i) => MAP_HOME_CARDS_MIN + i,
              ).map((n) => (
                <Pressable
                  key={n}
                  onPress={() => {
                    setMapHomeCardsCount(n);
                    patchSearchDisplay({ map_home_cards_count: n });
                  }}
                  style={[
                    styles.chip,
                    mapHomeCardsCount === n && styles.chipActive,
                  ]}
                >
                  <Text
                    className={
                      mapHomeCardsCount === n
                        ? "text-text-primary text-sm font-medium"
                        : "text-text-secondary text-sm"
                    }
                  >
                    {String(n)}
                  </Text>
                </Pressable>
              ))}
            </Box>
            <Text className="text-text-secondary mt-4 text-xs font-medium uppercase">
              {SEARCH_TRANSLATIONS["search.display_order_by"] ?? "Order by"}
            </Text>
            <Box className="mt-2 gap-1">
              {RESULTS_ORDER_BY_OPTIONS.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => {
                    setResultsOrderBy(key);
                    patchSearchDisplay({ results_order_by: key });
                  }}
                  style={[
                    styles.orderRow,
                    resultsOrderBy === key && styles.orderRowActive,
                  ]}
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
          </ScrollView>
          <Pressable onPress={onClose} style={styles.done}>
            <Text className="text-primary text-center text-sm font-semibold">
              Done
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: color("neutral.50"),
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
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
  done: {
    marginTop: 16,
    paddingVertical: 12,
  },
});
