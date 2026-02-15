import { Check, Plus } from "lucide-react";
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

/** Same sizing as CardHeartSave for consistent overlay buttons across all breakpoints */
const TOGGLE_SIZE: Record<
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
  const toggleClass = TOGGLE_SIZE[size];
  const iconSizeClass = sizeConfig?.iconClass ?? ICON_SIZE_FALLBACK[size];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  const baseButtonClasses =
    "touch-friendly group relative inline-flex items-center justify-center rounded-lg backdrop-blur-sm bg-white/90 shadow-md ring-1 ring-black/5 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 active:scale-95";

  const stateClasses = isSelected
    ? "text-olive"
    : "text-gray-600 hover:text-gray-700";

  // Check if this is being used as an inline button (no position specified or position is not absolute)
  const isInlineButton =
    !position ||
    className.includes("border") ||
    className.includes("rounded-md");

  if (isInlineButton) {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isSelected}
        className={`${baseButtonClasses} ${stateClasses} ${toggleClass} ${className}`}
        aria-label={
          ariaLabel ??
          (isSelected ? "Remove from comparison" : "Add to comparison")
        }
        title={isSelected ? "Remove from comparison" : "Add to comparison"}
      >
        {isSelected ? (
          <Check
            className={`${iconSizeClass} transition-all duration-200 group-hover:brightness-90`}
          />
        ) : (
          <Plus
            className={`${iconSizeClass} transition-all duration-200 group-hover:brightness-90`}
          />
        )}
      </button>
    );
  }

  return (
    <div className={`absolute ${POSITION_MAP[position]} z-10 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isSelected}
        className={`${baseButtonClasses} ${stateClasses} ${toggleClass}`}
        aria-label={
          ariaLabel ??
          (isSelected ? "Remove from comparison" : "Add to comparison")
        }
        title={isSelected ? "Remove from comparison" : "Add to comparison"}
      >
        {isSelected ? (
          <Check
            className={`${iconSizeClass} transition-all duration-200 group-hover:scale-110 group-hover:brightness-90`}
          />
        ) : (
          <Plus
            className={`${iconSizeClass} transition-all duration-200 group-hover:scale-110 group-hover:brightness-90`}
          />
        )}
      </button>
    </div>
  );
};

export default CardCompareCheckbox;
