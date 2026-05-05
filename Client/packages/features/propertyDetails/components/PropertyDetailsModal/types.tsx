import type { PropertyDetailsSectionId } from "packages/features/propertyDetails/types/sectionOrder";
import type { PropertyDetailsStreamProperty, SearchResult } from "packages/types";
import type { IsochroneData } from "packages/types/domain/api";

export type PropertyDetailsModalProps = {
  property: PropertyDetailsStreamProperty | SearchResult | null;
  onClose: () => void;
  onGenerateReport?: (address: string) => void;
  isLoading?: boolean;
  /** Size for toolbar buttons (heart, share, close). Default: medium */
  toolbarButtonSize?: "small" | "medium" | "large";
  /**
   * When opening details from search, pass the active isochrone overlay so the
   * commute map can show the same commute-area polygons as the search map.
   */
  commuteSearchOverlay?: IsochroneData | null;
};

export type PropertyComponentProps = {
  property: PropertyDetailsStreamProperty | SearchResult;
  /** Optional search isochrone overlay (see PropertyDetailsModalProps). */
  commuteSearchOverlay?: IsochroneData | null;
};

export type PropertyHeaderProps = PropertyComponentProps & {
  onClose: () => void;
  /** When provided (e.g. native page), show Back instead of Close */
  onBack?: () => void;
  onGenerateReport?: (address: string) => void;
  /** Size for toolbar buttons (heart, share, close). Default: medium */
  toolbarButtonSize?: "small" | "medium" | "large";
  /** Active section ID for navigation tabs */
  activeSection?: PropertyDetailsSectionId;
  /** Callback to scroll to a specific section */
  onScrollToSection?: (sectionId: PropertyDetailsSectionId) => void;
};

export type PropertyImageGalleryLayout = "default" | "modalSidebar";

/** Listing agent shown beside the modal thumb rail (desktop); omit on mobile via gallery layout. */
export type SidebarListingAgent = {
  imageUrl?: string;
  displayName?: string;
  businessName?: string;
  phone?: Record<string, unknown>;
};

export type PropertyImageGalleryProps = PropertyComponentProps & {
  currentImageIndex: number;
  onImageChange: (index: number) => void;
  /** Desktop modal: column hero + vertical thumb rail; mobile unchanged. */
  layout?: PropertyImageGalleryLayout;
  /** When set with layout modalSidebar, renders agent beside scrollable thumbs on md+ only. */
  sidebarListingAgent?: SidebarListingAgent | null;
  /** Show placeholder when images have not arrived yet (streaming). */
  isLoading?: boolean;
};
