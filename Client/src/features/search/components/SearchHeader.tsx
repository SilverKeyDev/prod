import SearchActions from "./SearchActions";
import { useConsolidatedSearchStore } from "../../../core/store/search";

type SearchHeaderProps = {
  onUpdatePreferences: () => void;
  onSearchProperties: () => void;
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
}: SearchHeaderProps) {
  const isSearching = useConsolidatedSearchStore((state) => state.isSearching);

  return (
    <div className="mb-responsive-md p-responsive-md mb-6 flex-shrink-0 rounded-lg border border-gray-200 bg-white md:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900">
              We use your preferences and important locations to surface the
              best properties
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
