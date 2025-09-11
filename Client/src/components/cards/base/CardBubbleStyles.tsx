// Simplified styling system for card bubbles - only handles sizing
export interface CardBubbleStyleConfig {
  /** Size variant for consistent scaling */
  size: "xs" | "sm" | "md" | "lg";
}

// Size configurations for margin and height only
export const CARD_BUBBLE_SIZES = {
  xs: {
    iconClass: "w-3 h-3",
    margin: "m-1.5",
    height: "h-6",
  },
  sm: {
    iconClass: "w-3.5 h-3.5",
    margin: "m-2",
    height: "h-7",
  },
  md: {
    iconClass: "w-4 h-4",
    margin: "m-2.5",
    height: "h-8",
  },
  lg: {
    iconClass: "w-5 h-5",
    margin: "m-3",
    height: "h-9",
  },
};

// Helper function to get size-specific classes
export const getCardBubbleSizeClasses = (
  size: CardBubbleStyleConfig["size"],
) => {
  return CARD_BUBBLE_SIZES[size];
};
