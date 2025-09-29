import type { Property } from "../../../../../packages/hooks/data/usePropertyDetails";
import type { SearchResult } from "../../../../../packages/schemas/search";

export type PropertyDetailsModalProps = {
  property: Property | SearchResult | null;
  onClose: () => void;
  isHomeSaved: (id: string) => boolean;
  saveHome: (property: Property | SearchResult) => Promise<void> | void;
  removeSavedHome: (id: string) => void;
  onGenerateReport?: (address: string) => void;
};

export type PropertyComponentProps = {
  property: Property | SearchResult;
};

export type PropertyHeaderProps = PropertyComponentProps & {
  onClose: () => void;
  isHomeSaved: (id: string) => boolean;
  saveHome: (property: Property | SearchResult) => Promise<void> | void;
  removeSavedHome: (id: string) => void;
  onGenerateReport?: (address: string) => void;
};

export type PropertyImageGalleryProps = PropertyComponentProps & {
  currentImageIndex: number;
  onImageChange: (index: number) => void;
};
