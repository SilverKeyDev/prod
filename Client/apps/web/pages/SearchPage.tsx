import { SearchFeature } from "packages/features/search";

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
  return (
    <SearchFeature
      setMobileHeaderActions={setMobileHeaderActions}
      onSearchProperties={onSearchProperties}
      searchRef={searchRef}
    />
  );
}
