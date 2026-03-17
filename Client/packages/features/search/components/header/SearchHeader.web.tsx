import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { Box } from "packages/ui/components/primitives";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { ClientSelector } from "@/components/ui";

import SearchActions from "./SearchActions.web";
import SearchHeaderLocations from "./SearchHeaderLocations.web";
type SearchHeaderProps = {
  /** Called when filters are changed (e.g. trigger search) */
  onPreferencesChanged?: () => void | Promise<void>;
  onSearchProperties: () => void;
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
};

export default function SearchHeader({
  onPreferencesChanged,
  onSearchProperties,
  onCancelSearch,
  isSearching,
  selectedClientId,
  onClientChange,
  mode,
  onToggleMode,
  onBeforeSwitchToReels,
}: SearchHeaderProps) {
  const { userPreferences } = useUserPreferences();
  const locations = userPreferences?.important_locations;
  const hasLocations = Array.isArray(locations) && locations.length > 0;

  return (
    <Box
      className={`mb-responsive-md mb-6 mt-6 flex w-full flex-shrink-0 flex-nowrap items-center justify-between gap-3 pr-8 ${HEADER_ROW_HEIGHT}`}
    >
      {selectedClientId !== undefined && onClientChange ? (
        <Box className="flex shrink-0">
          <ClientSelector selectedClientId={selectedClientId} onClientChange={onClientChange} />
        </Box>
      ) : (
        <Box className="min-w-0 flex-1" />
      )}

      <Box className="flex min-w-0 flex-1 items-center">
        <SearchHeaderLocations onPreferencesChanged={onPreferencesChanged} />
      </Box>

      <Box className="ml-auto flex items-center gap-2">
        <SearchActions
          onPreferencesChanged={onPreferencesChanged}
          onSearchProperties={onSearchProperties}
          onCancelSearch={onCancelSearch}
          isSearching={isSearching}
          hasLocations={hasLocations}
          variant="desktop"
          showReelsButton={mode === "map"}
          onToggleMode={onToggleMode}
          onBeforeSwitchToReels={onBeforeSwitchToReels}
        />
      </Box>
    </Box>
  );
}
