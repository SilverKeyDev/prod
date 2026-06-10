import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/structure/primitives";
import { HEADER_ROW_CONTROL_HEIGHT, HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { Button, CancelButton } from "@/components/ui";

import SearchFiltersDropdown from "./filters/SearchFiltersDropdown.web";

type SearchActionsProps = {
  /** Preferences / isochrone search (explicit Search control). */
  onSearchProperties?: () => void;
  onCancelSearch?: () => void;
  isSearching?: boolean;
  /** Display-only: whether saved important locations exist (empty-state UI, not search gating). */
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
  /**
   * Mobile: when true with `variant="mobile"`, render Search + Filters + Reels (+ Cancel when searching)
   * as a tight cluster for beside `SearchLocationBarWeb`; order is Search, Filter, Reels after the bar.
   */
  mobileToolbarCluster?: boolean;
};
export default function SearchActions({
  onSearchProperties,
  onCancelSearch,
  isSearching = false,
  hasLocations: _hasLocations = true,
  variant = "desktop",
  onToggleMode,
  onBeforeSwitchToReels: _onBeforeSwitchToReels,
  showReelsButton: _showReelsButton = false,
  showMapButton = false,
  selectedClientId,
  onClientChange,
  desktopToolsOnly = false,
  mobileToolbarCluster = false,
}: SearchActionsProps) {
  const { t } = useLocalization();
  // Reels button temporarily hidden — restore: const showReels = showReelsButton && onToggleMode != null;
  const showMap = showMapButton && onToggleMode != null;
  const handleSearchClick = () => {
    void onSearchProperties?.();
  };
  const btnClass = `shrink-0 ${HEADER_ROW_CONTROL_HEIGHT}`;
  if (variant === "mobile") {
    const searchButtonClass = mobileToolbarCluster
      ? `touch-friendly max-w-[32vw] shrink-0 px-2 sm:max-w-none sm:px-3 ${HEADER_ROW_CONTROL_HEIGHT}`
      : `touch-friendly min-w-[min(28vw,8.5rem)] flex-1 basis-0 px-4 ${HEADER_ROW_CONTROL_HEIGHT}`;

    const filtersBlock = (
      <Box className="flex shrink-0">
        <SearchFiltersDropdown
          variant="mobile"
          selectedClientId={selectedClientId}
          onClientChange={onClientChange}
        />
      </Box>
    );

    const cancelButton =
      isSearching && onCancelSearch ? (
        <CancelButton onClick={onCancelSearch} size="sm" className={`touch-friendly ${btnClass}`}>
          {t("common.cancel")}
        </CancelButton>
      ) : null;

    const reelsAndMap = (
      <>
        {/* Reels button temporarily hidden
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
        */}
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
      </>
    );

    const searchButtonEl = (
      <Button
        variant="tertiary"
        size="sm"
        loading={isSearching}
        onClick={handleSearchClick}
        disabled={isSearching}
        iconName={!isSearching ? "search" : undefined}
        truncateLabel={false}
        label={isSearching ? t("search.searching") : t("search.search")}
        className={searchButtonClass}
        {...(mobileToolbarCluster ? { hideTextBelow: "sm" as const } : {})}
      >
        {isSearching ? t("search.searching") : t("search.search")}
      </Button>
    );

    const cluster = mobileToolbarCluster ? (
      <>
        {searchButtonEl}
        {cancelButton}
        {filtersBlock}
        {reelsAndMap}
      </>
    ) : (
      <>
        {filtersBlock}
        {searchButtonEl}
        {cancelButton}
        {reelsAndMap}
      </>
    );

    if (mobileToolbarCluster) {
      return (
        <Box
          className={`flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2 ${HEADER_ROW_HEIGHT}`}
        >
          {cluster}
        </Box>
      );
    }

    return (
      <Box className={`flex w-full flex-shrink-0 items-center gap-2 ${HEADER_ROW_HEIGHT}`}>
        <Box className="flex min-w-0 flex-1 items-center gap-2">{cluster}</Box>
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
      {!desktopToolsOnly ? (
        <>
          <Button
            variant="tertiary"
            size="sm"
            loading={isSearching}
            onClick={handleSearchClick}
            disabled={isSearching}
            iconName={!isSearching ? "search" : undefined}
            truncateLabel={false}
            label={isSearching ? t("search.searching") : t("search.search")}
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
      {/* Reels button temporarily hidden
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
      */}
    </Box>
  );
}
