import SearchActions from "./SearchActions";

type SearchHeaderProps = {
  onUpdatePreferences: () => void;
  onSearchProperties: () => void;
  isSearching: boolean;
  onPreviousProperty?: () => void;
  onNextProperty?: () => void;
  currentPage?: number;
  totalProperties?: number;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
};

export default function SearchHeader({
  onUpdatePreferences,
  onSearchProperties,
  isSearching,
}: SearchHeaderProps) {
  return (
    <div className="mt-6 mb-responsive-md mb-6 flex-shrink-0 flex items-center justify-end">
      <SearchActions
        onUpdatePreferences={onUpdatePreferences}
        onSearchProperties={onSearchProperties}
        isSearching={isSearching}
        variant="desktop"
      />
    </div>
  );
}
