import { useLocalization } from "packages/contexts";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { useGoogleMaps } from "packages/hooks/data";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { Box } from "packages/ui/components/primitives";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { Button, CancelButton } from "@/components/ui";

import {
  type PreciseStreetAddressPayload,
  SearchLocationBarWeb,
} from "./location-bar/SearchLocationBar.web";
import SearchActions from "./SearchActions.web";

type SearchHeaderProps = {
  onSearchProperties: () => void;
  onLocationSearchSubmit: () => void | Promise<void>;
  onCancelSearch?: () => void;
  isSearching: boolean;
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
  onPreviousProperty?: () => void;
  onNextProperty?: () => void;
  currentPage?: number;
  totalProperties?: number;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  mode?: "map" | "reels";
  onToggleMode?: () => void;
  onBeforeSwitchToReels?: () => void;
  hasSearched?: boolean;
  /** When false, preferences Search is disabled until user adds an important location */
  hasLocations?: boolean;
  fitMapToBounds: (bounds: google.maps.LatLngBounds) => void;
  onPreciseStreetAddressSelected?: (
    payload: PreciseStreetAddressPayload,
  ) => void;
};

export default function SearchHeader({
  onSearchProperties,
  onLocationSearchSubmit,
  onCancelSearch,
  isSearching,
  selectedClientId,
  onClientChange,
  mode,
  onToggleMode,
  onBeforeSwitchToReels,
  hasLocations = true,
  fitMapToBounds,
  onPreciseStreetAddressSelected,
}: SearchHeaderProps) {
  const { isLoaded: scriptsReady } = useGoogleMaps();
  const { t } = useLocalization();
  const btnClass = `shrink-0 ${HEADER_ROW_HEIGHT}`;
  const handleSearchClick = () => {
    if (!hasLocations) {
      showErrorToast(t("search.add_location_to_search"));
      return;
    }
    onSearchProperties();
  };

  return (
    <Box
      className={`mb-responsive-md mb-6 mt-6 flex w-full min-w-0 flex-shrink-0 flex-row flex-nowrap items-center gap-3 pr-8 ${HEADER_ROW_HEIGHT}`}
    >
      <Box className="flex min-w-0 flex-1 flex-row flex-nowrap items-center gap-2">
        <Box className="min-w-0 flex-1">
          <SearchLocationBarWeb
            scriptsReady={scriptsReady}
            fitMapToBounds={fitMapToBounds}
            onSearch={onLocationSearchSubmit}
            onPreciseStreetAddressSelected={onPreciseStreetAddressSelected}
            locationPlaceholder={
              SEARCH_TRANSLATIONS["search.location_bar_placeholder"] ??
              "City, neighborhood, or ZIP"
            }
          />
        </Box>
        <Button
          variant="tertiary"
          size="sm"
          loading={isSearching}
          onClick={handleSearchClick}
          disabled={isSearching || !hasLocations}
          title={!hasLocations ? t("search.add_location_to_search") : undefined}
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
      </Box>
      <SearchActions
        onSearchProperties={onSearchProperties}
        onCancelSearch={onCancelSearch}
        isSearching={isSearching}
        hasLocations={hasLocations}
        variant="desktop"
        desktopToolsOnly
        showReelsButton={mode === "map"}
        onToggleMode={onToggleMode}
        onBeforeSwitchToReels={onBeforeSwitchToReels}
        selectedClientId={selectedClientId}
        onClientChange={onClientChange}
      />
    </Box>
  );
}
