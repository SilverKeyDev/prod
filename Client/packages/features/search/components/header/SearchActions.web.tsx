import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";
import { TOUR_TARGETS_MOBILE } from "packages/utils/tour/tourTargets";

import { Button, CancelButton, IconButton } from "@/components/ui";

import SearchDisplayDropdown from "./display/SearchDisplayDropdown.web";
import SearchFiltersDropdown from "./filters/SearchFiltersDropdown.web";

type SearchActionsProps = {
  /** Preferences / isochrone search (explicit Search control). */
  onSearchProperties?: () => void;
  onCancelSearch?: () => void;
  isSearching?: boolean;
  /** Retained for API compatibility; search availability is handled in SearchFeature (important locations vs location bar). */
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
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
  /** Desktop: only Filters / Display / Reels — Search+Cancel rendered beside the location bar */
  desktopToolsOnly?: boolean;
};
export default function SearchActions({
  onSearchProperties,
  onCancelSearch,
  isSearching = false,
  hasLocations: _hasLocations = true,
  variant = "desktop",
  onToggleMode,
  onBeforeSwitchToReels,
  showReelsButton = false,
  showMapButton = false,
  selectedClientId,
  onClientChange,
  desktopToolsOnly = false,
}: SearchActionsProps) {
  const { t } = useLocalization();
  const showReels = showReelsButton && onToggleMode != null;
  const showMap = showMapButton && onToggleMode != null;
  const handleSearchClick = () => {
    void onSearchProperties?.();
  };
  const btnClass = `shrink-0 ${HEADER_ROW_HEIGHT}`;
  if (variant === "mobile") {
    return (
      <Box
        className={`flex w-full flex-shrink-0 items-center gap-2 ${HEADER_ROW_HEIGHT}`}
        id={TOUR_TARGETS_MOBILE.searchRun}
      >
        <Box className="flex min-w-0 flex-1 items-center gap-2">
          <SearchFiltersDropdown
            variant="mobile"
            selectedClientId={selectedClientId}
            onClientChange={onClientChange}
          />
          <SearchDisplayDropdown variant="mobile" />
          <Button
            variant="tertiary"
            size="sm"
            loading={isSearching}
            onClick={handleSearchClick}
            disabled={isSearching}
            iconName={!isSearching ? "search" : undefined}
            className={`touch-friendly min-w-min flex-1 px-4 ${HEADER_ROW_HEIGHT}`}
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
      <SearchFiltersDropdown
        variant="desktop"
        selectedClientId={selectedClientId}
        onClientChange={onClientChange}
      />
      <SearchDisplayDropdown variant="desktop" />
      {!desktopToolsOnly ? (
        <>
          <Button
            variant="tertiary"
            size="sm"
            loading={isSearching}
            onClick={handleSearchClick}
            disabled={isSearching}
            iconName={!isSearching ? "search" : undefined}
            className={btnClass}
          >
            {isSearching ? t("search.searching") : t("search.search")}
          </Button>
          {isSearching && onCancelSearch ? (
            <CancelButton onClick={onCancelSearch} size="sm" className={btnClass}>
              {t("common.cancel")}
            </CancelButton>
          ) : null}
        </>
      ) : null}
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
