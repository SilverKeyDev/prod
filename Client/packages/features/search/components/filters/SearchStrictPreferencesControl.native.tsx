import React from "react";

import { StyleSheet, Switch } from "react-native";

import { useStrictPreferencesToggle } from "packages/features/search/hooks/ui/useStrictPreferencesToggle";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { Box, Text } from "packages/ui/components/structure/primitives";

export function SearchStrictPreferencesControlNative(): React.ReactElement {
  const { preferencesStrictFilter, handleStrictPreferences } = useStrictPreferencesToggle();

  return (
    <Box className="border-border mt-4 border-t pt-4">
      <Box style={styles.row}>
        <Text className="text-text-primary flex-1 pr-2 text-sm">
          {SEARCH_TRANSLATIONS["search.strict_preferences"] ?? "Match all preferences strictly"}
        </Text>
        <Switch value={preferencesStrictFilter} onValueChange={handleStrictPreferences} />
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
});
