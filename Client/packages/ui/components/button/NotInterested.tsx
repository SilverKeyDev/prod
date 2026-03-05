import React, { useState } from "react";

import { Icon } from "@ui/icons";

import { log, LOG_CATEGORIES } from "packages/logger";
import type { Property } from "packages/schemas/property";
import { useUIStore } from "packages/store";
import { dateNow } from "packages/utils/date";

import { getCardBubbleSizeClasses } from "@/components/cards/base/styles";
import NotInterestedModal from "@/components/modals/standalone/NotInterestedModal";
import { useNotInterestedHomesData } from "@/features/search/hooks/data/saved/useNotInterestedHomesData";
import type { SearchResult } from "@/features/search/types";

import IconButton from "./IconButton";
export type CardNotInterestedProps = {
  property: SearchResult | Property;
  /** Optional not-interested state functions for use outside React context (e.g., map markers) */
  isHomeNotInterested?: (propertyId: string) => boolean;
  markNotInterested?: (property: SearchResult | Property, why?: string) => Promise<void>;
  removeNotInterested?: (propertyId: string) => Promise<void>;
  /** Callback when not-interested is marked (for showing reason card) */
  onMarkNotInterested?: () => void;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
};
const CIRCLE_SIZE: Record<NonNullable<CardNotInterestedProps["size"]>, string> = {
  xs: "w-8 h-8",
  sm: "w-9 h-9",
  md: "w-11 h-11",
  lg: "w-13 h-13",
};
const ICON_SIZE_FALLBACK: Record<NonNullable<CardNotInterestedProps["size"]>, string> = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};
const POSITION_MAP: Record<NonNullable<CardNotInterestedProps["position"]>, string> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};
const CardNotInterested: React.FC<CardNotInterestedProps> = ({
  property,
  isHomeNotInterested: providedIsHomeNotInterested,
  markNotInterested: providedMarkNotInterested,
  removeNotInterested: providedRemoveNotInterested,
  onMarkNotInterested,
  position = "top-left",
  size = "md",
  className = "",
  ariaLabel,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Always call the hook to respect React's Rules of Hooks
  const hookData = useNotInterestedHomesData();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  // Prefer provided functions (e.g., from map markers) but keep hook values as fallback
  const isHomeNotInterested = providedIsHomeNotInterested || hookData?.isNotInterested;
  const markNotInterested = providedMarkNotInterested || hookData?.markNotInterested;
  const removeNotInterested = providedRemoveNotInterested || hookData?.removeNotInterested;
  // Determine if home is not-interested - use address for matching
  // Ensure address is a string before passing it
  const propertyAddress = typeof property.address === "string" ? property.address : undefined;
  const isNotInterested = isHomeNotInterested
    ? isHomeNotInterested(property.id, propertyAddress)
    : false;
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isNotInterested) {
        // Remove from not-interested - pass address for better matching
        if (removeNotInterested) {
          await removeNotInterested(property.id, propertyAddress);
        }
      } else {
        // If callback provided, use new flow: show reason card immediately (no API call)
        if (onMarkNotInterested) {
          // Show reason card immediately for better UX
          onMarkNotInterested();
        } else {
          // Fallback to old modal flow for backward compatibility
          setIsModalOpen(true);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      log.error(LOG_CATEGORIES.SEARCH, "Error updating not-interested", {
        propertyId: property.id,
        address: propertyAddress,
        action: isNotInterested ? "remove" : "add",
        error: errorMessage,
        timestamp: dateNow().toISOString(),
      });
      enqueueToast({
        type: "error",
        message: `Failed to ${isNotInterested ? "undo" : "mark"} not interested`,
      });
    }
  };
  const handleModalConfirm = async (why?: string) => {
    setIsModalOpen(false);
    try {
      if (markNotInterested) {
        await markNotInterested(property, why);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      log.error(LOG_CATEGORIES.SEARCH, "Error marking as not-interested", {
        propertyId: property.id,
        address: propertyAddress,
        why,
        error: errorMessage,
        timestamp: dateNow().toISOString(),
      });
      enqueueToast({
        type: "error",
        message: "Failed to mark as not interested",
      });
    }
  };
  const sizeConfig = getCardBubbleSizeClasses(size);
  const circleClass = CIRCLE_SIZE[size];
  const iconSizeClass = sizeConfig?.iconClass ?? ICON_SIZE_FALLBACK[size];
  // Check if this is being used as an inline button (no position specified or position is not absolute)
  const isInlineButton =
    !position || className.includes("border") || className.includes("rounded-md");
  return (
    <>
      {isInlineButton ? (
        // Inline button styling - matches other buttons in PropertyHeader
        <>
          <IconButton
            variant="ghost"
            icon={
              <Icon
                name="x"
                className={`${iconSizeClass} ${isNotInterested ? "fill-current" : ""} transition-transform duration-200`}
              />
            }
            label={
              ariaLabel ?? (isNotInterested ? "Undo not interested" : "Mark as not interested")
            }
            onClick={handleClick}
            aria-pressed={isNotInterested}
            className={`group relative inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isNotInterested ? "text-gray-600 hover:text-gray-700" : "text-gray-400 hover:text-gray-600"} ${className}`}
            title={isNotInterested ? "Undo not interested" : "Mark as not interested"}
          />
          <NotInterestedModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleModalConfirm}
            propertyAddress={propertyAddress}
          />
        </>
      ) : (
        // Original card overlay styling
        <>
          <div className={`absolute ${POSITION_MAP[position]} z-10`}>
            <IconButton
              variant="ghost"
              icon={
                <>
                  <Icon
                    name="x"
                    className={`${iconSizeClass} ${isNotInterested ? "fill-current" : ""} transition-transform duration-200 group-hover:scale-110`}
                  />
                  {/* Sparkles micro-accent on hover/active */}
                  <Icon
                    name="sparkles"
                    className={`absolute left-1 top-1 h-2 w-2 scale-50 text-white opacity-0 transition-all duration-300 group-hover:scale-75 group-hover:opacity-30 group-active:opacity-50`}
                  />
                </>
              }
              label={
                ariaLabel ?? (isNotInterested ? "Undo not interested" : "Mark as not interested")
              }
              onClick={handleClick}
              aria-pressed={isNotInterested}
              className={`group relative inline-flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent active:scale-95 ${isNotInterested ? "text-white hover:text-white" : "text-white hover:text-white"} ${circleClass} ${className}`}
              title={isNotInterested ? "Undo not interested" : "Mark as not interested"}
            />
          </div>
          <NotInterestedModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleModalConfirm}
            propertyAddress={propertyAddress}
          />
        </>
      )}
    </>
  );
};
export default CardNotInterested;
