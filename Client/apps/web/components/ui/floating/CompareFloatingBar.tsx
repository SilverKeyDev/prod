import React from "react";

import Button from "@ui/button/Button";
import IconButton from "@ui/button/IconButton";
import { BarChart2, X } from "lucide-react";

import { useLocalization } from "packages/contexts";
import type { SavedHome } from "packages/schemas";

import { StyledImage } from "@/components/cards/base/image";

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
    <div className="safe-bottom fixed left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg transition-all duration-300 ease-in-out bottom-reserved md:bottom-0">
      <div className="mx-auto max-w-7xl px-responsive-md py-responsive-sm sm:px-6 sm:py-4">
        <div className="flex items-center gap-responsive-sm sm:gap-4">
          {/* Count and thumbnails */}
          <div className="flex flex-1 items-center gap-responsive-sm">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-olive/10 sm:h-10 sm:w-10">
                <BarChart2 className="h-4 w-4 text-olive sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-responsive-sm font-medium text-gray-900">
                {countLabel}
              </p>
            </div>
            {/* Thumbnails */}
            <div className="hidden flex-shrink-0 items-center gap-responsive-sm sm:flex">
              {selectedHomes.slice(0, 4).map((home) => (
                <div
                  key={home.home_id}
                  className="group relative h-12 w-12 overflow-hidden rounded-lg border-2 border-gray-200"
                >
                  {home.image_url ? (
                    <StyledImage
                      src={home.image_url}
                      alt={
                        typeof home.address === "string"
                          ? home.address
                          : (home.description ??
                            t("compare_floating.property_fallback"))
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
                      onRemove(home.home_id);
                    }}
                    variant="ghost"
                    size="xs"
                    rounded="full"
                    icon={<X className="h-3 w-3" />}
                    className="absolute -right-1 -top-1 bg-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={t("compare_floating.remove_aria")}
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
          <div className="flex flex-shrink-0 items-center gap-responsive-sm">
            <Button
              onClick={onClear}
              variant="outline"
              size="sm"
              iconName="x"
              className="hidden sm:inline-flex border-gray-300 text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400 focus:ring-gray-300/20 disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white disabled:hover:text-gray-400"
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
