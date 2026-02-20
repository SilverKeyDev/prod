import { Video } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";

import { Button, CancelButton, IconButton } from "@/components/ui/index.web";

import SearchFiltersDropdown from "./SearchFiltersDropdown.web";

type SearchActionsProps = {
  /** Called when filters dropdown is closed and preferences were changed (e.g. trigger search) */
  onPreferencesChanged?: () => void | Promise<void>;
  onSearchProperties: () => void;
  onCancelSearch?: () => void;
  isSearching: boolean;
  /** When false, Search is disabled and click shows toast to add a location (default true for backward compat) */
  hasLocations?: boolean;
  variant?: "desktop" | "mobile";
  /** When provided with onToggleMode, shows Reels button (only in map mode) */
  onToggleMode?: () => void;
  /** Called before switching to Reels (e.g. to set anchor from map selection) */
  onBeforeSwitchToReels?: () => void;
  /** Show Reels button (Video icon) - only in map mode */
  showReelsButton?: boolean;
  /** Show Map button to switch back from reels - only in reels mode */
  showMapButton?: boolean;
};

export default function SearchActions({
  onPreferencesChanged,
  onSearchProperties,
  onCancelSearch,
  isSearching,
  hasLocations = true,
  variant = "desktop",
  onToggleMode,
  onBeforeSwitchToReels,
  showReelsButton = false,
  showMapButton = false,
}: SearchActionsProps) {
  const { t } = useLocalization();
  const showReels = showReelsButton && onToggleMode != null;
  const showMap = showMapButton && onToggleMode != null;

  const handleSearchClick = () => {
    if (!hasLocations) {
      showErrorToast(t("search.add_location_to_search"));
      return;
    }
    onSearchProperties();
  };

  if (variant === "mobile") {
    return (
      <div className="mt-4 mb-2 flex w-full flex-col gap-2">
        <div className="flex h-11 flex-1 flex-wrap items-center gap-2">
          <SearchFiltersDropdown
            onPreferencesChanged={onPreferencesChanged}
            variant="mobile"
          />
          <Button
            variant="tertiary"
            size="sm"
            loading={isSearching}
            onClick={handleSearchClick}
            disabled={isSearching || !hasLocations}
            title={
              !hasLocations ? t("search.add_location_to_search") : undefined
            }
            iconName={!isSearching ? "search" : undefined}
            className="touch-friendly h-11 flex-1 min-w-0 shrink-0"
          >
            {isSearching ? t("search.searching") : t("search.search")}
          </Button>
          {isSearching && onCancelSearch && (
            <CancelButton
              onClick={onCancelSearch}
              size="sm"
              className="touch-friendly h-11 shrink-0"
            >
              {t("common.cancel")}
            </CancelButton>
          )}
          {showReels && (
            <IconButton
              variant="toolbar"
              size="sm"
              icon={<Video className="h-8 w-8" />}
              onClick={() => {
                onBeforeSwitchToReels?.();
                onToggleMode();
              }}
              className="touch-friendly h-11 w-11 shrink-0"
              label={t("search.reels")}
            />
          )}
          {showMap && (
            <Button
              variant="outline"
              size="sm"
              iconName="map"
              onClick={onToggleMode}
              className="touch-friendly h-11 shrink-0"
            >
              {t("search.map")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-11 flex-shrink-0 flex-wrap items-center gap-3">
      <SearchFiltersDropdown
        onPreferencesChanged={onPreferencesChanged}
        variant="desktop"
      />
      <div className="flex h-11 items-center gap-2">
        <Button
          variant="tertiary"
          size="sm"
          loading={isSearching}
          onClick={handleSearchClick}
          disabled={isSearching || !hasLocations}
          title={!hasLocations ? t("search.add_location_to_search") : undefined}
          iconName={!isSearching ? "search" : undefined}
          className="h-11 shrink-0"
        >
          {isSearching ? t("search.searching") : t("search.search")}
        </Button>
        {isSearching && onCancelSearch && (
          <CancelButton
            onClick={onCancelSearch}
            size="sm"
            className="h-11 shrink-0"
          >
            {t("common.cancel")}
          </CancelButton>
        )}
        {showReels && (
          <IconButton
            variant="toolbar"
            size="sm"
            icon={<Video className="h-8 w-8" />}
            onClick={() => {
              onBeforeSwitchToReels?.();
              onToggleMode();
            }}
            className="ml-2 mr-2 h-11 w-11 shrink-0"
            label={t("search.reels")}
          />
        )}
      </div>
    </div>
  );
}
