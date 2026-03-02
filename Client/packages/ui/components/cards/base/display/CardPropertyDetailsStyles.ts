export const CARD_PROPERTY_SIZE_STYLES = {
  sm: {
    text: "text-xs sm:text-sm text-gray-500",
    icon: "w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400",
    gap: "gap-1 sm:gap-1.5",
    spacing: "px-[1px]",
  },
  md: {
    text: "text-sm sm:text-base text-gray-500",
    icon: "w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400",
    gap: "gap-1.5 sm:gap-2",
    spacing: "px-[1px]",
  },
} as const;

export type CardPropertySizeStyles = (typeof CARD_PROPERTY_SIZE_STYLES)["sm" | "md"];
