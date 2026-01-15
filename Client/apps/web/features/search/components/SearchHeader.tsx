import SearchActions from "./SearchActions";
import ClientSelector from "../../../components/ui/ClientSelector";

type SearchHeaderProps = {
  onUpdatePreferences: () => void;
  onSearchProperties: () => void;
  isSearching: boolean;
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
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
  selectedClientId,
  onClientChange,
}: SearchHeaderProps) {
  return (
    <div className="mt-6 mb-responsive-md mb-6 flex flex-shrink-0 items-center justify-between gap-3">
      {selectedClientId !== undefined && onClientChange ? (
        <ClientSelector
          selectedClientId={selectedClientId}
          onClientChange={onClientChange}
        />
      ) : (
        <div />
      )}

      <SearchActions
        onUpdatePreferences={onUpdatePreferences}
        onSearchProperties={onSearchProperties}
        isSearching={isSearching}
        variant="desktop"
      />
    </div>
  );
}
