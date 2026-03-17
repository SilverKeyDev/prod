import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { Box } from "packages/ui/components/primitives";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { Button, CancelButton, IconButton } from "@/components/ui";

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
  const btnClass = `shrink-0 ${HEADER_ROW_HEIGHT}`;
  if (variant === "mobile") {
    return (
      <Box className={`flex w-full flex-shrink-0 items-center gap-2 ${HEADER_ROW_HEIGHT}`}>
        <Box className="flex min-w-0 flex-1 items-center gap-2">
          <SearchFiltersDropdown onPreferencesChanged={onPreferencesChanged} variant="mobile" />
          <Button
            variant="tertiary"
            size="sm"
            loading={isSearching}
            onClick={handleSearchClick}
            disabled={isSearching || !hasLocations}
            title={!hasLocations ? t("search.add_location_to_search") : undefined}
            iconName={!isSearching ? "search" : undefined}
            className={`touch-friendly min-w-0 flex-1 px-4 ${btnClass}`}
          >
            {isSearching ? t("search.searching") : t("search.search")}
          </Button>
          {isSearching && onCancelSearch && (
            <CancelButton
              onClick={onCancelSearch}
              size="sm"
              className={`touch-friendly ${btnClass}`}
            >
              {t("common.cancel")}
            </CancelButton>
          )}
        </Box>
        {showReels && (
          <IconButton
            variant="toolbar"
            size="sm"
            icon={<Icon name="video" className="h-5 w-5" />}
            onClick={() => {
              onBeforeSwitchToReels?.();
              onToggleMode();
            }}
            className={`touch-friendly w-11 ${btnClass}`}
            label={t("search.reels")}
          />
        )}
        {showMap && (
          <Button
            variant="outline"
            size="sm"
            iconName="map"
            onClick={onToggleMode}
            className={`touch-friendly ${btnClass}`}
          >
            {t("search.map")}
          </Button>
        )}
      </Box>
    );
  }
  return (
    <Box className={`flex flex-shrink-0 flex-nowrap items-center gap-3 ${HEADER_ROW_HEIGHT}`}>
      <SearchFiltersDropdown onPreferencesChanged={onPreferencesChanged} variant="desktop" />
      <Button
        variant="tertiary"
        size="sm"
        loading={isSearching}
        onClick={handleSearchClick}
        disabled={isSearching || !hasLocations}
        title={!hasLocations ? t("search.add_location_to_search") : undefined}
        iconName={!isSearching ? "search" : undefined}
        className={`px-4 ${btnClass}`}
      >
        {isSearching ? t("search.searching") : t("search.search")}
      </Button>
      {isSearching && onCancelSearch && (
        <CancelButton onClick={onCancelSearch} size="sm" className={btnClass}>
          {t("common.cancel")}
        </CancelButton>
      )}
      {showReels && (
        <IconButton
          variant="toolbar"
          size="sm"
          icon={<Icon name="video" className="h-8 w-8" />}
          onClick={() => {
            onBeforeSwitchToReels?.();
            onToggleMode();
          }}
          className={`ml-2 mr-2 w-11 ${btnClass}`}
          label={t("search.reels")}
        />
      )}
    </Box>
  );
}
