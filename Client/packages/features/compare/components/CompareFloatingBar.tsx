import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { SavedHome } from "packages/types";
import { Box } from "packages/ui/components/primitives";

import { StyledImage } from "@/components/cards/base/image";
import { BodyText, Button, IconButton } from "@/components/ui";
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
  return (
    <Box className="safe-bottom bottom-reserved border-border bg-background-surface fixed left-0 right-0 z-50 border-t shadow-lg md:bottom-0">
      <Box className="px-responsive-md py-responsive-sm max-w-7xl self-center sm:px-6 sm:py-4">
        <Box className="gap-responsive-sm flex flex-row items-center sm:gap-4">
          {/* Count and thumbnails */}
          <Box className="gap-responsive-sm flex flex-1 flex-row items-center">
            <Box className="flex-shrink-0">
              <Box className="bg-primary-muted flex h-8 w-8 flex-row items-center justify-center rounded-full sm:h-10 sm:w-10">
                <Icon name="bar-chart-2" className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
              </Box>
            </Box>
            <Box className="min-w-0 flex-1">
              <BodyText size="sm" className="font-medium">
                {countLabel}
              </BodyText>
            </Box>
            {/* Thumbnails */}
            <Box className="gap-responsive-sm hidden flex-shrink-0 flex-row items-center sm:flex">
              {selectedHomes.slice(0, 4).map((home) => (
                <Box
                  key={getHomeId(home)}
                  className="border-border group relative h-12 w-12 overflow-hidden rounded-lg border-2"
                >
                  {home.image_url ? (
                    <StyledImage
                      src={home.image_url}
                      alt={
                        typeof home.address === "string"
                          ? home.address
                          : t("compare_floating.property_fallback")
                      }
                      variant="professional"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Box className="bg-primary-muted flex h-full w-full flex-row items-center justify-center">
                      <Icon name="bar-chart-2" className="text-text-disabled h-5 w-5" />
                    </Box>
                  )}
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(getHomeId(home));
                    }}
                    variant="ghost"
                    size="xs"
                    rounded="full"
                    icon={<Icon name="x" className="h-3 w-3" />}
                    className="bg-background-surface absolute -right-1 -top-1 opacity-0 shadow-sm group-hover:opacity-100 group-active:opacity-75"
                    label={t("compare_floating.remove_aria")}
                  />
                </Box>
              ))}
              {selectedHomes.length > 4 && (
                <Box className="border-border bg-background-base text-text-secondary flex h-12 w-12 flex-row items-center justify-center rounded-lg border-2 text-xs font-medium">
                  {t("compare_floating.more_count", {
                    count: selectedHomes.length - 4,
                  })}
                </Box>
              )}
            </Box>
          </Box>

          {/* Actions */}
          <Box className="gap-responsive-sm flex flex-shrink-0 flex-row items-center">
            <Button
              onClick={onClear}
              variant="outline"
              size="sm"
              iconName="x"
              className="border-border bg-background-surface text-text-secondary hover:border-border hover:bg-background-base hover:text-text-secondary focus:ring-accent-muted active:border-border active:border-border active:bg-primary-muted active:bg-background-base active:text-text-secondary active:text-text-primary disabled:border-border disabled:text-text-disabled disabled:hover:bg-background-surface disabled:hover:text-text-disabled hidden flex-row sm:inline-flex"
              hideTextBelow="sm"
              label={t("compare_floating.clear_aria")}
            >
              {t("compare_floating.clear")}
            </Button>
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
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
export default CompareFloatingBar;
