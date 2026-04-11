import React from "react";

import { useLocalization } from "packages/contexts";
import { SavedHomeCard } from "packages/features/saved/components/SavedHomeCard";
import type { SavedHome } from "packages/types";
import { Box, Text } from "packages/ui/components/primitives";

interface SavedHomesListProps {
  filteredHomes: SavedHome[];
  selectedHomesForComparison: Set<string>;
  loading: boolean;
  showEmpty: boolean;
  onToggleHomeSelection: (homeId: string) => void;
  onUnlockHome: (home: SavedHome) => void;
}

export function SavedHomesList({
  filteredHomes,
  selectedHomesForComparison,
  loading,
  showEmpty,
  onToggleHomeSelection,
  onUnlockHome,
}: SavedHomesListProps) {
  const { t } = useLocalization();

  if (loading && filteredHomes.length === 0) {
    return (
      <Box className="py-8">
        <Text className="text-text-secondary text-center text-sm">
          {t("saved.loading_homes", {
            defaultValue: "Loading saved homes…",
          })}
        </Text>
      </Box>
    );
  }

  if (showEmpty) {
    return (
      <Box className="py-8">
        <Text className="text-text-secondary text-center text-sm">
          {t("saved.no_homes_yet", {
            defaultValue:
              "No saved homes yet. Save homes from Search to see them here.",
          })}
        </Text>
      </Box>
    );
  }

  return (
    <>
      {filteredHomes.map((home) => (
        <SavedHomeCard
          key={home.home_id}
          home={home}
          isSelected={selectedHomesForComparison.has(home.home_id)}
          onToggleCompare={onToggleHomeSelection}
          onUnlock={onUnlockHome}
        />
      ))}
    </>
  );
}
