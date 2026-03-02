import React from "react";

import { BarChart2, X } from "lucide-react";

import { useLocalization } from "packages/contexts";
import type { SavedHome } from "packages/types";
import Button from "packages/ui/components/button/Button";
import IconButton from "packages/ui/components/button/IconButton";
import BodyText from "packages/ui/components/text/BodyText";

import { StyledImage } from "@/components/cards/base/image";

/** SavedHome from API/saved list may include home_id; type only guarantees address. */
function getHomeId(home: SavedHome): string {
  return "home_id" in home && typeof (home as { home_id?: string }).home_id === "string"
    ? (home as { home_id: string }).home_id
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
    <div className="safe-bottom bottom-reserved fixed left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg transition-all duration-300 ease-in-out md:bottom-0">
      <div className="px-responsive-md py-responsive-sm mx-auto max-w-7xl sm:px-6 sm:py-4">
        <div className="gap-responsive-sm flex items-center sm:gap-4">
          {/* Count and thumbnails */}
          <div className="gap-responsive-sm flex flex-1 items-center">
            <div className="flex-shrink-0">
              <div className="bg-olive/10 flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10">
                <BarChart2 className="text-olive h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <BodyText size="sm" className="font-medium">
                {countLabel}
              </BodyText>
            </div>
            {/* Thumbnails */}
            <div className="gap-responsive-sm hidden flex-shrink-0 items-center sm:flex">
              {selectedHomes.slice(0, 4).map((home) => (
                <div
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
                    <div className="flex h-full w-full items-center justify-center bg-gray-100">
                      <BarChart2 className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(getHomeId(home));
                    }}
                    variant="ghost"
                    size="xs"
                    rounded="full"
                    icon={<X className="h-3 w-3" />}
                    className="absolute -right-1 -top-1 bg-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                    label={t("compare_floating.remove_aria")}
                  />
                </div>
              ))}
              {selectedHomes.length > 4 && (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50 text-xs font-medium text-gray-600">
                  {t("compare_floating.more_count", {
                    count: selectedHomes.length - 4,
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="gap-responsive-sm flex flex-shrink-0 items-center">
            <Button
              onClick={onClear}
              variant="outline"
              size="sm"
              iconName="x"
              className="hidden border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700 focus:ring-gray-300/20 disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white disabled:hover:text-gray-400 sm:inline-flex"
              hideTextBelow="sm"
            >
              {t("compare_floating.clear")}
            </Button>
            <Button
              onClick={onCompare}
              variant="primary"
              size="sm"
              icon={<BarChart2 />}
              className="flex-1 sm:flex-none"
              disabled={!canCompare}
            >
              {t("compare_floating.compare")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareFloatingBar;
