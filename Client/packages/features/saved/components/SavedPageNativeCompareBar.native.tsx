import React from "react";

import Button from "@ui/button/Button";

import { useLocalization } from "packages/contexts";
import type { SavedHome } from "packages/types";
import { Box, Text } from "packages/ui/components/structure/primitives";

type SavedPageNativeCompareBarProps = {
  selectedHomesData: SavedHome[];
  onCompare: () => void;
  onClearComparison: () => void;
};

export function SavedPageNativeCompareBar({
  selectedHomesData,
  onCompare,
  onClearComparison,
}: SavedPageNativeCompareBarProps) {
  const { t } = useLocalization();

  if (selectedHomesData.length < 1) {
    return null;
  }

  return (
    <Box className="border-border bg-background-surface mt-4 rounded-lg border p-3">
      <Text className="text-text-primary text-sm font-medium">
        {t("saved.compare_bar_title", {
          defaultValue: "Compare selected homes",
        })}
      </Text>
      <Text className="text-text-secondary mt-1 text-xs">
        {t("saved.compare_bar_subtitle", {
          defaultValue: "{{count}} selected",
          count: selectedHomesData.length,
        })}
      </Text>
      <Box className="mt-3 flex flex-row gap-2">
        <Button variant="primary" size="sm" onPress={onCompare} className="flex-1" iconName="save">
          <Text className="text-sm font-medium">
            {t("saved.compare_now", { defaultValue: "Compare now" })}
          </Text>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onPress={onClearComparison}
          className="flex-1"
          iconName="save"
        >
          <Text className="text-sm font-medium">
            {t("saved.clear_selection", { defaultValue: "Clear" })}
          </Text>
        </Button>
      </Box>
    </Box>
  );
}
