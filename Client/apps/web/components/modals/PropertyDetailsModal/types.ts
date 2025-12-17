import type { Property } from "../../../../../packages/hooks/data/usePropertyDetails";
import type { SearchResult } from "../../../../../packages/schemas/search";

export type PropertyDetailsModalProps = {
  property: Property | SearchResult | null;
  onClose: () => void;
  onGenerateReport?: (address: string) => void;
  isLoading?: boolean;
};

export type PropertyComponentProps = {
  property: Property | SearchResult;
};

export type PropertyHeaderProps = PropertyComponentProps & {
  onClose: () => void;
  onGenerateReport?: (address: string) => void;
  onOpenPriorities?: () => void;
};

export type PropertyImageGalleryProps = PropertyComponentProps & {
  currentImageIndex: number;
  onImageChange: (index: number) => void;
};
