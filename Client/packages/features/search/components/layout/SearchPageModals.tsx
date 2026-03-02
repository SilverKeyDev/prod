import { PropertyDetailsModal } from "packages/features/propertyDetails";

import type { Property } from "@/features/search/hooks/data/property/usePropertyDetails";
import type { SearchResult } from "@/features/search/types/result";

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
      property={selectedProperty as Property | SearchResult | null}
      onClose={onClosePropertyDetails}
      isLoading={isLoadingPropertyDetails}
    />
  );
}
