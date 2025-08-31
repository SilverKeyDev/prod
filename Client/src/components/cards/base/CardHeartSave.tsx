import React from "react";
import { Heart, Sparkles } from "lucide-react";
import { getCardBubbleSizeClasses } from "./CardBubbleStyles";

export interface CardHeartSaveProps {
  property: { id: string; address: string; [key: string]: any };
  isSaved: boolean;
  onSave: (property: any) => void | Promise<void>;
  onRemove: (propertyId: string) => void | Promise<void>;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
}

const CIRCLE_SIZE: Record<NonNullable<CardHeartSaveProps["size"]>, string> = {
  xs: "w-7 h-7",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const ICON_SIZE_FALLBACK: Record<NonNullable<CardHeartSaveProps["size"]>, string> = {
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
  isSaved,
  onSave,
  onRemove,
  position = "top-right",
  size = "md",
  className = "",
  ariaLabel,
}) => {
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isSaved) await onRemove(property.id);
      else await onSave(property);
    } catch (error) {
      console.error("❌ [FAVORITES] Error updating favorites:", {
        propertyId: property.id,
        address: property.address,
        action: isSaved ? "remove" : "add",
        error,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const sizeConfig = getCardBubbleSizeClasses(size);
  const circleClass = CIRCLE_SIZE[size];
  const iconSizeClass = sizeConfig?.iconClass || ICON_SIZE_FALLBACK[size];

  return (
    <div
      className={`absolute ${POSITION_MAP[position]} z-10`}
      // ensure the card container is `relative`
    >
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isSaved}
        className={`
          group relative inline-flex items-center justify-center rounded-full bg-white
          shadow-md ring-1 ring-black/5 hover:ring-black/10 focus:outline-none
          focus:ring-2 focus:ring-offset-2 focus:ring-black/20 transition-all duration-300
          hover:shadow-lg hover:scale-105 active:scale-95
          ${isSaved ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"}
          ${circleClass} ${className}
        `}
        aria-label={ariaLabel || (isSaved ? "Remove from saved homes" : "Save to favorites")}
        title={isSaved ? "Remove from saved homes" : "Save to favorites"}
      >
        <Heart className={`${iconSizeClass} ${isSaved ? "fill-current" : ""} transition-transform duration-200 group-hover:scale-110`} />
        
        {/* Sparkles micro-accent on hover/active */}
        <Sparkles className={`w-2 h-2 absolute top-1 left-1 text-white opacity-0 scale-50 transition-all duration-300 group-hover:opacity-30 group-hover:scale-75 group-active:opacity-50`} />
      </button>
    </div>
  );
};

export default CardHeartSave;
