import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { SavedHome } from "packages/types";
import { SelectionBottomDock } from "packages/ui/components/layout";

import { Button } from "@/components/ui";
/** SavedHome from API/saved list may include home_id; type only guarantees address. */
function getHomeId(home: SavedHome): string {
  return "home_id" in home &&
    typeof (
      home as {
        home_id?: string;
      }
    ).home_id === "string"
    ? (
        home as {
          home_id: string;
        }
      ).home_id
    : home.address;
}
export type CompareFloatingBarProps = {
  selectedHomes: SavedHome[];
  onCompare: () => void;
  onClear: () => void;
  onRemove: (homeId: string) => void;
};
const CompareFloatingBar: React.FC<CompareFloatingBarProps> = ({
  selectedHomes,
  onCompare,
  onClear,
  onRemove,
}) => {
  const { t } = useLocalization();
  if (selectedHomes.length < 1) {
    return null;
  }
  const canCompare = selectedHomes.length >= 2;
  const countLabel =
    selectedHomes.length === 1
      ? t("compare_floating.home_selected")
      : t("compare_floating.homes_selected", { count: selectedHomes.length });
  const items = selectedHomes.map((home) => ({
    id: getHomeId(home),
    imageUrl: home.image_url,
    thumbnailAlt:
      typeof home.address === "string" ? home.address : t("compare_floating.property_fallback"),
  }));
  const moreCountLabel =
    selectedHomes.length > 4
      ? t("compare_floating.more_count", {
          count: selectedHomes.length - 4,
        })
      : undefined;

  return (
    <SelectionBottomDock
      items={items}
      countLabel={countLabel}
      summaryIcon={<Icon name="bar-chart-2" className="text-primary h-4 w-4 sm:h-5 sm:w-5" />}
      thumbnailFallbackIcon={<Icon name="bar-chart-2" className="text-text-disabled h-5 w-5" />}
      onRemove={onRemove}
      onClear={onClear}
      clearLabel={t("compare_floating.clear")}
      clearAriaLabel={t("compare_floating.clear_aria")}
      removeThumbnailAriaLabel={t("compare_floating.remove_aria")}
      moreCountLabel={moreCountLabel}
    >
      <Button
        onClick={onCompare}
        variant="primary"
        size="sm"
        icon={<Icon name="bar-chart-2" />}
        className="flex-1 sm:flex-none"
        disabled={!canCompare}
      >
        {t("compare_floating.compare")}
      </Button>
    </SelectionBottomDock>
  );
};
export default CompareFloatingBar;
