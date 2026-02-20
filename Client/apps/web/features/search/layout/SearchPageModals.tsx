import { PropertyDetailsModal } from "@/components/modals";

export type SearchPageModalsProps = {
  selectedProperty: unknown;
  onClosePropertyDetails: () => void;
  isLoadingPropertyDetails: boolean;
};

export function SearchPageModals({
  selectedProperty,
  onClosePropertyDetails,
  isLoadingPropertyDetails,
}: SearchPageModalsProps): JSX.Element {
  return (
    <PropertyDetailsModal
      property={selectedProperty}
      onClose={onClosePropertyDetails}
      isLoading={isLoadingPropertyDetails}
    />
  );
}
