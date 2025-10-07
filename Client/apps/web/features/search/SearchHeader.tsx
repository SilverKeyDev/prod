import SearchActions from "./SearchActions";
import Card from "../../components/layout/Card";

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
    <Card className="mb-responsive-md mb-6 flex-shrink-0">
      <div className="flex items-center justify-end">
        <SearchActions
          onUpdatePreferences={onUpdatePreferences}
          onSearchProperties={onSearchProperties}
          isSearching={isSearching}
          variant="desktop"
        />
      </div>
    </Card>
  );
}
