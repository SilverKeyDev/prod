import { SearchFeature } from "packages/features/search";
import { useGoogleMapsStoreIntegration } from "packages/hooks/store/map/useGoogleMapsStoreIntegration";

import { SearchProductTourMount } from "@/app/tour/SearchProductTourMount.web";

type SearchPageProps = {
  setMobileHeaderActions: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
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
    <>
      <SearchProductTourMount />
      <SearchFeature
        setMobileHeaderActions={setMobileHeaderActions}
        onSearchProperties={onSearchProperties}
        searchRef={searchRef}
      />
    </>
  );
}
