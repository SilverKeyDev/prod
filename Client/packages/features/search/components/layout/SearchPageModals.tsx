import { PropertyDetailsModal } from "packages/features/propertyDetails";
import type { IsochroneData } from "packages/types/domain/api";

import type { Property } from "@/features/search/hooks/data/property/usePropertyDetails";
import type { SearchResult } from "@/features/search/types/domain/result";

export type SearchPageModalsProps = {
  selectedProperty: unknown;
  onClosePropertyDetails: () => void;
  isLoadingPropertyDetails: boolean;
  commuteSearchOverlay?: IsochroneData | null;
};

export function SearchPageModals({
  selectedProperty,
  onClosePropertyDetails,
  isLoadingPropertyDetails,
  commuteSearchOverlay = null,
}: SearchPageModalsProps): JSX.Element {
  return (
    <PropertyDetailsModal
      property={selectedProperty as Property | SearchResult | null}
      onClose={onClosePropertyDetails}
      isLoading={isLoadingPropertyDetails}
      commuteSearchOverlay={commuteSearchOverlay}
    />
  );
}
