import type { ReactNode } from "react";

import type { Property, SearchResult } from "@/features/search/types";

export type PropertyCardProps = {
  /** Stable ID for memoization */
  id: string;
  /** Property image URL */
  imageUrl?: string;
  /** Property address */
  address: string;
  /** Match score (0-100) */
  score?: number;
  /** Property price */
  price: string;
  /** Property details */
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSize?: string;
  propertyType?: string;
  status?: { text: string; className: string };
  /** Card actions */
  onViewDetails?: () => void;
  /** Card state */
  loading?: boolean;
  /** Card type for appropriate sizing */
  cardType?: "searchpage" | "regular";
  /** Price position */
  pricePosition?: "top-left" | "top-right" | "below-address";
  /** Top content (e.g., heart save button) */
  topContent?: ReactNode;
  /** Bottom content (e.g., Unlock button) */
  bottomContent?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Custom styling */
  className?: string;
  showScore?: boolean;
  /** Whether to hide square footage */
  hideSquareFootage?: boolean;
  /** Whether to show triangle pointer for map cards */
  showTrianglePointer?: boolean;
  /** Whether this card is displayed on the map */
  isOnMap?: boolean;
  /** Whether to hide the image section (for mobile carousel) */
  hideImage?: boolean;
  /** Property object for not interested functionality */
  property?: SearchResult | Property;
  /** Callback when reason is selected for not interested */
  onSelectNotInterestedReason?: (why: string) => Promise<void>;
  /** Callback when not interested is undone */
  onUndoNotInterested?: () => Promise<void>;
  /** Whether to show not interested button (only in results tab) */
  showNotInterested?: boolean;
  /** Card width override */
  width?: "auto" | "full" | "standard" | "wide" | "narrow";
};
