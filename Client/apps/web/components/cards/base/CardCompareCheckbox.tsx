import { Check, Square } from "lucide-react";
import React from "react";

import { getCardBubbleSizeClasses } from "./CardBubbleStyles.tsx";

export type CardCompareCheckboxProps = {
  isSelected: boolean;
  onToggle: () => void;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
};

const CIRCLE_SIZE: Record<
  NonNullable<CardCompareCheckboxProps["size"]>,
  string
> = {
  xs: "w-8 h-8",
  sm: "w-9 h-9",
  md: "w-11 h-11",
  lg: "w-13 h-13",
};

const ICON_SIZE_FALLBACK: Record<
  NonNullable<CardCompareCheckboxProps["size"]>,
  string
> = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const POSITION_MAP: Record<
  NonNullable<CardCompareCheckboxProps["position"]>,
  string
> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};

const CardCompareCheckbox: React.FC<CardCompareCheckboxProps> = ({
  isSelected,
  onToggle,
  position = "top-left",
  size = "md",
  className = "",
  ariaLabel,
}) => {
  const sizeConfig = getCardBubbleSizeClasses(size);
  const circleClass = CIRCLE_SIZE[size];
  const iconSizeClass = sizeConfig?.iconClass ?? ICON_SIZE_FALLBACK[size];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  // Check if this is being used as an inline button (no position specified or position is not absolute)
  const isInlineButton =
    !position ||
    className.includes("border") ||
    className.includes("rounded-md");

  if (isInlineButton) {
    // Inline button styling
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isSelected}
        className={`inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isSelected
            ? "text-olive hover:text-olive/80"
            : "text-gray-400 hover:text-olive"
        } ${className}`}
        aria-label={
          ariaLabel ??
          (isSelected ? "Remove from comparison" : "Add to comparison")
        }
        title={isSelected ? "Remove from comparison" : "Add to comparison"}
      >
        {isSelected ? (
          <Check
            className={`${iconSizeClass} transition-transform duration-200`}
          />
        ) : (
          <Square
            className={`${iconSizeClass} transition-transform duration-200`}
          />
        )}
      </button>
    );
  }

  // Original card overlay styling
  return (
    <div className={`absolute ${POSITION_MAP[position]} z-10 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isSelected}
        className={`touch-friendly group relative inline-flex items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 active:scale-95 ${
          isSelected
            ? "text-olive hover:text-olive/80"
            : "text-gray-400 hover:text-olive"
        } ${circleClass}`}
        aria-label={
          ariaLabel ??
          (isSelected ? "Remove from comparison" : "Add to comparison")
        }
        title={isSelected ? "Remove from comparison" : "Add to comparison"}
      >
        {isSelected ? (
          <Check
            className={`${iconSizeClass} transition-transform duration-200 group-hover:scale-110`}
          />
        ) : (
          <Square
            className={`${iconSizeClass} transition-transform duration-200 group-hover:scale-110`}
          />
        )}
      </button>
    </div>
  );
};

export default CardCompareCheckbox;
