import { Heart, Sparkles } from "lucide-react";
import React from "react";

import { getCardBubbleSizeClasses } from "../../cards/base/CardBubbleStyles.tsx";
import { useSavedHomesData } from "../../../../../packages/hooks/data/useSavedHomesData";
import { useUIStore } from "../../../../../packages/store";
import type { SearchResult } from "../../../../../packages/schemas/search";
import type { Property } from "../../../../../packages/schemas/property";

export type CardHeartSaveProps = {
  property: SearchResult | Property;
  /** @deprecated isSaved is now handled internally */
  isSaved?: boolean;
  /** @deprecated onSave is now handled internally */
  onSave?: (property: unknown) => void | Promise<void>;
  /** @deprecated onRemove is now handled internally */
  onRemove?: (propertyId: string) => void | Promise<void>;
  /** Optional save state functions for use outside React context (e.g., map markers) */
  isHomeSaved?: (propertyId: string) => boolean;
  saveHome?: (property: SearchResult | Property) => Promise<void>;
  removeSavedHome?: (propertyId: string) => Promise<void>;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
};

const CIRCLE_SIZE: Record<NonNullable<CardHeartSaveProps["size"]>, string> = {
  xs: "w-8 h-8",
  sm: "w-9 h-9",
  md: "w-11 h-11",
  lg: "w-13 h-13",
};

const ICON_SIZE_FALLBACK: Record<
  NonNullable<CardHeartSaveProps["size"]>,
  string
> = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const POSITION_MAP: Record<
  NonNullable<CardHeartSaveProps["position"]>,
  string
> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};

const CardHeartSave: React.FC<CardHeartSaveProps> = ({
  property,
  isSaved: _deprecatedIsSaved,
  onSave: _deprecatedOnSave,
  onRemove: _deprecatedOnRemove,
  isHomeSaved: providedIsHomeSaved,
  saveHome: providedSaveHome,
  removeSavedHome: providedRemoveSavedHome,
  position = "top-right",
  size = "md",
  className = "",
  ariaLabel,
}) => {
  // Always call the hook to respect React's Rules of Hooks
  const hookData = useSavedHomesData();
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  // Prefer provided functions (e.g., from map markers) but keep hook values as fallback
  const isHomeSaved = providedIsHomeSaved || hookData?.isHomeSaved;
  const saveHome = providedSaveHome || hookData?.saveHome;
  const removeSavedHome = providedRemoveSavedHome || hookData?.removeSavedHome;

  // Determine if home is saved - use address for matching
  // Ensure address is a string before passing it
  const propertyAddress =
    typeof property.address === "string" ? property.address : undefined;
  const isSaved = isHomeSaved
    ? isHomeSaved(property.id, propertyAddress)
    : false;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isSaved) {
        // Remove from saved homes - pass address for better matching
        if (removeSavedHome) {
          await removeSavedHome(property.id, propertyAddress);
        }
      } else {
        // Save home
        if (saveHome) {
          await saveHome(property);
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ [FAVORITES] Error updating favorites:", {
        propertyId: property.id,
        address: propertyAddress,
        action: isSaved ? "remove" : "add",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
      enqueueToast({
        type: "error",
        message: `Failed to ${isSaved ? "remove" : "save"} home`,
      });
    }
  };

  const sizeConfig = getCardBubbleSizeClasses(size);
  const circleClass = CIRCLE_SIZE[size];
  const iconSizeClass = sizeConfig?.iconClass ?? ICON_SIZE_FALLBACK[size];

  // Check if this is being used as an inline button (no position specified or position is not absolute)
  const isInlineButton =
    !position ||
    className.includes("border") ||
    className.includes("rounded-md");

  if (isInlineButton) {
    // Inline button styling - matches other buttons in PropertyHeader
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isSaved}
        className={`group relative inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSaved ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"} ${className}`}
        aria-label={
          ariaLabel ??
          (isSaved ? "Remove from saved homes" : "Save to favorites")
        }
        title={isSaved ? "Remove from saved homes" : "Save to favorites"}
      >
        <Heart
          className={`${iconSizeClass} ${isSaved ? "fill-current" : ""} transition-transform duration-200`}
        />
      </button>
    );
  }

  // Original card overlay styling
  return (
    <div
      className={`absolute ${POSITION_MAP[position]} z-10`}
      // ensure the card container is `relative`
    >
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isSaved}
        className={`group relative inline-flex items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 active:scale-95 ${isSaved ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"} ${circleClass} ${className} `}
        aria-label={
          ariaLabel ??
          (isSaved ? "Remove from saved homes" : "Save to favorites")
        }
        title={isSaved ? "Remove from saved homes" : "Save to favorites"}
      >
        <Heart
          className={`${iconSizeClass} ${isSaved ? "fill-current" : ""} transition-transform duration-200 group-hover:scale-110`}
        />

        {/* Sparkles micro-accent on hover/active */}
        <Sparkles
          className={`absolute left-1 top-1 h-2 w-2 scale-50 text-white opacity-0 transition-all duration-300 group-hover:scale-75 group-hover:opacity-30 group-active:opacity-50`}
        />
      </button>
    </div>
  );
};

export default CardHeartSave;
