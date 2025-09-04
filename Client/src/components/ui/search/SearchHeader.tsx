import SearchActions from "./SearchActions";

interface SearchHeaderProps {
  onUpdatePreferences: () => void;
  onSearchProperties: () => void;
  isSearching: boolean;
  onPreviousProperty?: () => void;
  onNextProperty?: () => void;
  currentPage?: number;
  totalProperties?: number;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
}

export default function SearchHeader({
  onUpdatePreferences,
  onSearchProperties,
  isSearching,
}: SearchHeaderProps) {
  return (
    <div className="mb-responsive-md flex-shrink-0 bg-white border border-gray-200 rounded-lg p-responsive-md md:p-6 mb-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900">
              We use your preferences and important locations to surface
              the best properties
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <SearchActions
              onUpdatePreferences={onUpdatePreferences}
              onSearchProperties={onSearchProperties}
              isSearching={isSearching}
              variant="desktop"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
