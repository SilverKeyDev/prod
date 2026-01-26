import PropertyDetailsModal from "../modals/PropertyDetailsModal/PropertyDetailsModal";
import NegotiationModal from "../modals/NegotiationModal";
import CompareHomesModal from "../modals/CompareHomesModal";
import CompareFloatingBar from "../ui/CompareFloatingBar";
import type { SavedHome } from "../../../../packages/schemas";
import type { SavedPageViewType } from "../../../../packages/hooks/store/documents/useSavedPageView";
import { convertToFavoriteHome } from "../../../../packages/utils/saved/savedHomeUtils";

type SavedPageModalsProps = {
  viewType: SavedPageViewType;
  selectedProperty: unknown;
  clearSelectedProperty: () => void;
  isLoadingPropertyDetails: boolean;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (open: boolean) => void;
  selectedHomesData: SavedHome[];
  handleRemoveFromComparison: (homeId: string) => void;
  handleToggleHomeSelection: (homeId: string) => void;
  homes: SavedHome[];
  isNegotiationModalOpen: boolean;
  selectedHomeForNegotiation: SavedHome | null;
  handleCloseNegotiation: () => void;
  handleCompare: () => void;
  handleClearComparison: () => void;
};

export default function SavedPageModals({
  viewType,
  selectedProperty,
  clearSelectedProperty,
  isLoadingPropertyDetails,
  isCompareModalOpen,
  setIsCompareModalOpen,
  selectedHomesData,
  handleRemoveFromComparison,
  handleToggleHomeSelection,
  homes,
  isNegotiationModalOpen,
  selectedHomeForNegotiation,
  handleCloseNegotiation,
  handleCompare,
  handleClearComparison,
}: SavedPageModalsProps) {
  return (
    <>
      {/* Property Details Modal */}
      {selectedProperty && (
        <PropertyDetailsModal
          property={selectedProperty}
          onClose={clearSelectedProperty}
          isLoading={isLoadingPropertyDetails}
        />
      )}

      {/* Compare Homes Modal */}
      <CompareHomesModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        selectedHomes={selectedHomesData}
        onRemove={handleRemoveFromComparison}
        onAdd={handleToggleHomeSelection}
        allLikedHomes={homes}
      />

      {/* Negotiation Modal */}
      <NegotiationModal
        isOpen={isNegotiationModalOpen}
        onClose={handleCloseNegotiation}
        initialHome={
          selectedHomeForNegotiation
            ? convertToFavoriteHome(selectedHomeForNegotiation)
            : null
        }
      />

      {/* Compare Floating Bar - Show when viewing homes list and >= 1 selected */}
      {viewType === "homes" && selectedHomesData.length >= 1 && (
        <CompareFloatingBar
          selectedHomes={selectedHomesData}
          onCompare={handleCompare}
          onClear={handleClearComparison}
          onRemove={handleRemoveFromComparison}
        />
      )}
    </>
  );
}
