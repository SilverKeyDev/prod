import React from "react";

import { Icon } from "@ui/icons";

import Button from "packages/ui/components/button/Button";
import { getCardBubbleSizeClasses } from "packages/ui/components/cards/base/styles/CardBubbleStyles";
import { Box } from "packages/ui/components/primitives";
export type CardCompareCheckboxProps = {
  isSelected: boolean;
  onToggle: () => void;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
  /** Icon when not selected. Default `plus` (compare / add). Use `search` when the affordance is “find / add from search” until a bottom dock is open. */
  unselectedIcon?: "plus" | "search";
};
/** Same sizing as CardHeartSave for consistent overlay buttons across all breakpoints */
const TOGGLE_SIZE: Record<NonNullable<CardCompareCheckboxProps["size"]>, string> = {
  xs: "w-8 h-8",
  sm: "w-9 h-9",
  md: "w-11 h-11",
  lg: "w-13 h-13",
};
const ICON_SIZE_FALLBACK: Record<NonNullable<CardCompareCheckboxProps["size"]>, string> = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};
const POSITION_MAP: Record<NonNullable<CardCompareCheckboxProps["position"]>, string> = {
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
  unselectedIcon = "plus",
}) => {
  const sizeConfig = getCardBubbleSizeClasses(size);
  const toggleClass = TOGGLE_SIZE[size];
  const iconSizeClass = sizeConfig?.iconClass ?? ICON_SIZE_FALLBACK[size];
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };
  const baseButtonClasses =
    "touch-friendly group relative inline-flex items-center justify-center rounded-lg backdrop-blur-sm bg-background-surface shadow-md ring-1 ring-black/5 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:ring-black/10 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-0 active:scale-95";
  const stateClasses = isSelected
    ? "text-primary"
    : "text-text-secondary hover:text-text-secondary";
  // Check if this is being used as an inline button (no position specified or position is not absolute)
  const isInlineButton =
    !position || className.includes("border") || className.includes("rounded-md");
  const unselectedGlyph = unselectedIcon === "search" ? "search" : "plus";

  if (isInlineButton) {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={handleClick}
        aria-pressed={isSelected}
        className={`${baseButtonClasses} ${stateClasses} ${toggleClass} ${className}`}
        label={ariaLabel ?? (isSelected ? "Remove from comparison" : "Add to comparison")}
        title={isSelected ? "Remove from comparison" : "Add to comparison"}
      >
        {isSelected ? (
          <Icon
            name="check"
            className={`${iconSizeClass} transition-all duration-200 group-hover:brightness-90`}
          />
        ) : (
          <Icon
            name={unselectedGlyph}
            className={`${iconSizeClass} transition-all duration-200 group-hover:brightness-90`}
          />
        )}
      </Button>
    );
  }
  return (
    <Box className={`absolute ${POSITION_MAP[position]} z-10 ${className}`}>
      <Button
        type="button"
        variant="ghost"
        onClick={handleClick}
        aria-pressed={isSelected}
        className={`${baseButtonClasses} ${stateClasses} ${toggleClass}`}
        label={ariaLabel ?? (isSelected ? "Remove from comparison" : "Add to comparison")}
        title={isSelected ? "Remove from comparison" : "Add to comparison"}
      >
        {isSelected ? (
          <Icon
            name="check"
            className={`${iconSizeClass} transition-all duration-200 group-hover:scale-110 group-hover:brightness-90`}
          />
        ) : (
          <Icon
            name={unselectedGlyph}
            className={`${iconSizeClass} transition-all duration-200 group-hover:scale-110 group-hover:brightness-90`}
          />
        )}
      </Button>
    </Box>
  );
};
export default CardCompareCheckbox;
