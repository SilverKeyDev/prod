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
    <Box className="safe-bottom bottom-reserved fixed left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg md:bottom-0">
      <Box className="px-responsive-md py-responsive-sm max-w-7xl self-center sm:px-6 sm:py-4">
        <Box className="gap-responsive-sm flex flex-row items-center sm:gap-4">
          {/* Count and thumbnails */}
          <Box className="gap-responsive-sm flex flex-1 flex-row items-center">
            <Box className="flex-shrink-0">
              <Box className="flex h-8 w-8 flex-row items-center justify-center rounded-full bg-neutral-100 sm:h-10 sm:w-10">
                <Icon name="bar-chart-2" className="text-olive h-4 w-4 sm:h-5 sm:w-5" />
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
                  className="group relative h-12 w-12 overflow-hidden rounded-lg border-2 border-gray-200"
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
                    <Box className="flex h-full w-full flex-row items-center justify-center bg-gray-100">
                      <Icon name="bar-chart-2" className="h-5 w-5 text-gray-400" />
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
                    className="absolute -right-1 -top-1 bg-white opacity-0 shadow-sm group-hover:opacity-100 group-active:opacity-75"
                    label={t("compare_floating.remove_aria")}
                  />
                </Box>
              ))}
              {selectedHomes.length > 4 && (
                <Box className="flex h-12 w-12 flex-row items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50 text-xs font-medium text-gray-600">
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
              className="hidden flex-row border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700 focus:ring-neutral-400 active:border-gray-400 active:border-gray-500 active:bg-gray-100 active:bg-gray-50 active:text-gray-700 active:text-gray-800 disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white disabled:hover:text-gray-400 sm:inline-flex"
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
