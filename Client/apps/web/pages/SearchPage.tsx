import { SearchFeature } from "packages/features/search";
import { useGoogleMapsStoreIntegration } from "packages/hooks/store/map/useGoogleMapsStoreIntegration";

type SearchPageProps = {
  setMobileHeaderActions: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
  onSearchProperties?: () => Promise<void>;
  searchRef?: React.MutableRefObject<{
    triggerSearch: () => Promise<void>;
  } | null>;
};

export default function SearchPage({
  setMobileHeaderActions,
  onSearchProperties,
  searchRef,
}: SearchPageProps) {
  // Initialize Google Maps only when Search page loads (deferred from app-wide initialization)
  useGoogleMapsStoreIntegration();

  return (
    <SearchFeature
      setMobileHeaderActions={setMobileHeaderActions}
      onSearchProperties={onSearchProperties}
      searchRef={searchRef}
    />
  );
}
