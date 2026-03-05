import React from "react";

import { Icon } from "@ui/icons";

import { log, LOG_CATEGORIES } from "packages/logger";
import { useUIStore } from "packages/store";
import { dateNow } from "packages/utils/date";

import { getCardBubbleSizeClasses } from "@/components/cards/base/styles";

import IconButton from "./IconButton";
import {
  OVERLAY_MARKER_CIRCLE_CLASSES,
  OVERLAY_MARKER_ICON_CLASSES,
} from "./overlayMarkerButtonTypes";
/** Minimal property shape for presentational heart (no feature dependency). */
export type CardHeartSavePropertyLike = {
  id: string;
  address?: string;
};
/** Props for presentational heart when parent provides save state. Use ConnectedCardHeartSave from features/search for connected behavior. */
export type CardHeartSaveWithPropsProps = {
  property: CardHeartSavePropertyLike;
  isSaved: boolean;
  saveHome: (property: CardHeartSavePropertyLike) => Promise<void>;
  removeSavedHome: (propertyId: string, propertyAddress?: string) => Promise<void>;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: "xs" | "sm" | "md" | "lg" | "small" | "medium" | "large";
  className?: string;
  ariaLabel?: string;
};
/** Maps small/medium/large to legacy sizes for card overlay */
const TOOLBAR_TO_LEGACY: Record<"small" | "medium" | "large", "xs" | "sm" | "md" | "lg"> = {
  small: "sm",
  medium: "md",
  large: "lg",
};
const ICON_SIZE_FALLBACK: Record<"xs" | "sm" | "md" | "lg", string> = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};
const POSITION_MAP: Record<NonNullable<CardHeartSaveWithPropsProps["position"]>, string> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};
/**
 * Presentational heart that does not use useSavedHomesData. Use when the parent
 * provides isSaved and save/remove callbacks (e.g. map card) to avoid rerenders
 * when any other home is liked.
 */
export const CardHeartSaveWithProps: React.FC<CardHeartSaveWithPropsProps> = ({
  property,
  isSaved,
  saveHome,
  removeSavedHome,
  position = "top-right",
  size = "md",
  className = "",
  ariaLabel,
}) => {
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const propertyAddress = typeof property.address === "string" ? property.address : undefined;
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isSaved) {
        await removeSavedHome(property.id, propertyAddress);
      } else {
        await saveHome(property);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      log.error(LOG_CATEGORIES.SEARCH, "Error updating favorites", {
        propertyId: property.id,
        address: propertyAddress,
        action: isSaved ? "remove" : "add",
        error: errorMessage,
        timestamp: dateNow().toISOString(),
      });
      enqueueToast({
        type: "error",
        message: `Failed to ${isSaved ? "remove" : "save"} home`,
      });
    }
  };
  const isToolbarSize = (s: string): s is "small" | "medium" | "large" =>
    s === "small" || s === "medium" || s === "large";
  const effectiveSize = isToolbarSize(size) ? TOOLBAR_TO_LEGACY[size] : size;
  const sizeConfig = getCardBubbleSizeClasses(effectiveSize);
  const iconSizeClass = sizeConfig?.iconClass ?? ICON_SIZE_FALLBACK[effectiveSize];
  const isInlineButton =
    !position || className.includes("border") || className.includes("rounded-md");
  if (isInlineButton && isToolbarSize(size)) {
    return (
      <IconButton
        variant="toolbar"
        size={size}
        rounded="md"
        icon={
          <Icon
            name="heart"
            className={`h-full w-full ${isSaved ? "fill-current" : ""} transition-transform duration-200`}
          />
        }
        onClick={handleClick}
        aria-pressed={isSaved}
        aria-label={ariaLabel ?? (isSaved ? "Remove from saved homes" : "Save to favorites")}
        title={isSaved ? "Remove from saved homes" : "Save to favorites"}
        className={`bg-gray-50 ${isSaved ? "text-red-500 hover:bg-gray-50 hover:text-red-600" : "text-gray-600 hover:bg-gray-100"} ${className}`}
      />
    );
  }
  if (isInlineButton) {
    return (
      <IconButton
        variant="ghost"
        icon={
          <Icon
            name="heart"
            className={`${iconSizeClass} ${isSaved ? "fill-current" : ""} transition-transform duration-200`}
          />
        }
        label={ariaLabel ?? (isSaved ? "Remove from saved homes" : "Save to favorites")}
        onClick={handleClick}
        aria-pressed={isSaved}
        className={`group relative inline-flex items-center justify-center bg-white transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSaved ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"} ${className}`}
        title={isSaved ? "Remove from saved homes" : "Save to favorites"}
      />
    );
  }
  return (
    <div className={`absolute ${POSITION_MAP[position]} z-10`}>
      <IconButton
        variant="ghost"
        size="sm"
        icon={
          <>
            <Icon
              name="heart"
              className={`${OVERLAY_MARKER_ICON_CLASSES} ${isSaved ? "fill-current" : ""} transition-transform duration-200 group-hover:scale-110`}
            />
            <Icon
              name="sparkles"
              className={`absolute left-1 top-1 h-2 w-2 scale-50 text-white opacity-0 transition-all duration-300 group-hover:scale-75 group-hover:opacity-30 group-active:opacity-50`}
            />
          </>
        }
        label={ariaLabel ?? (isSaved ? "Remove from saved homes" : "Save to favorites")}
        onClick={handleClick}
        aria-pressed={isSaved}
        className={`group relative inline-flex items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-lg hover:ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 active:scale-95 ${isSaved ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"} ${OVERLAY_MARKER_CIRCLE_CLASSES} ${className} `}
        title={isSaved ? "Remove from saved homes" : "Save to favorites"}
      />
    </div>
  );
};
export default CardHeartSaveWithProps;
