import type { SearchResult } from "packages/types";

import type { Property } from "@/features/search/hooks/data/property/usePropertyDetails";

export type PropertyDetailsModalProps = {
  property: Property | SearchResult | null;
  onClose: () => void;
  onGenerateReport?: (address: string) => void;
  isLoading?: boolean;
  /** Size for toolbar buttons (heart, share, close). Default: medium */
  toolbarButtonSize?: "small" | "medium" | "large";
};

export type PropertyComponentProps = {
  property: Property | SearchResult;
};

export type PropertyHeaderProps = PropertyComponentProps & {
  onClose: () => void;
  onGenerateReport?: (address: string) => void;
  /** Size for toolbar buttons (heart, share, close). Default: medium */
  toolbarButtonSize?: "small" | "medium" | "large";
};

export type PropertyImageGalleryProps = PropertyComponentProps & {
  currentImageIndex: number;
  onImageChange: (index: number) => void;
};
