/**
 * IconButton variant, size, and rounded styles — single source of truth for web and native.
 * Platform files (.web, .native) must import from here; they must NOT define local
 * VARIANT_CLASSES, SIZE_CLASSES, etc.
 */

export type IconButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "outline"
  | "ghost"
  | "danger"
  | "toolbar";

export type IconButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "small" | "medium" | "large";

/**
 * Base styles that apply to all icon buttons.
 * Unified for web and native — flex flex-row for RN; no cursor (RN has no cursor).
 */
export const ICON_BUTTON_BASE_CLASSES =
  "flex flex-row flex-row items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95";

/** Gray secondary. Matches Button secondary/cancel. */
const GRAY_SECONDARY =
  "border border-border bg-neutral-200 text-text-primary hover:bg-neutral-300 hover:border-border active:bg-neutral-400 active:border-border focus:ring-neutral-400 disabled:bg-neutral-100 disabled:text-text-disabled disabled:border-border";

export const ICON_BUTTON_VARIANT_STYLES: Record<IconButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover focus:ring-neutral-400 disabled:bg-disabled disabled:text-text-disabled",
  secondary: GRAY_SECONDARY,
  tertiary:
    "border-2 border-black bg-accent text-white hover:bg-accent-hover active:bg-accent-hover focus:ring-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-400",
  outline:
    "border border-primary text-primary bg-background-surface hover:bg-primary hover:text-white active:bg-primary active:text-white focus:ring-neutral-400 disabled:border-border disabled:text-text-disabled disabled:hover:bg-background-surface disabled:hover:text-text-disabled",
  ghost:
    "text-primary hover:bg-neutral-100 active:bg-neutral-100 focus:ring-neutral-400 disabled:text-text-disabled disabled:hover:bg-transparent",
  danger:
    "bg-destructive text-white hover:bg-destructive-hover active:bg-destructive-hover focus:ring-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400",
  toolbar:
    "bg-transparent text-text-secondary border-0 shadow-none hover:bg-neutral-50 active:bg-neutral-100 focus:outline-none focus:ring-0 disabled:text-text-disabled disabled:hover:bg-transparent disabled:active:bg-transparent",
};

/** Unified size classes — raw Tailwind, same for web and native */
export const ICON_BUTTON_SIZE_CLASSES: Record<IconButtonSize, string> = {
  xs: "min-h-7 min-w-7 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4",
  sm: "min-h-8 min-w-8 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5",
  md: "min-h-9 min-w-9 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6",
  lg: "min-h-10 min-w-10 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7",
  xl: "min-h-11 min-w-11 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7",
  small: "min-h-6 min-w-6 h-6 w-6",
  medium: "min-h-7 min-w-7 h-7 w-7",
  large: "min-h-8 min-w-8 h-8 w-8",
};

export const ICON_BUTTON_ROUNDED_CLASSES: Record<
  "none" | "sm" | "md" | "lg" | "xl" | "full",
  string
> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

/** Toolbar variant: custom hover/active overrides */
export const ICON_BUTTON_HOVER_BG_MAP = {
  "gray-50": "hover:bg-neutral-50 active:bg-neutral-100",
  "gray-100": "hover:bg-neutral-100 active:bg-neutral-200",
  "gray-200": "hover:bg-neutral-200 active:bg-neutral-300",
} as const;

export const ICON_BUTTON_ACTIVE_BG_MAP = {
  "gray-100": "active:bg-gray-100",
  "gray-200": "active:bg-gray-200",
  "gray-300": "active:bg-gray-300",
} as const;

export const ICON_BUTTON_TOUCH_CLASS = "touch-manipulation active:scale-95";

/** Standalone icon size classes — for Icon components outside IconButton. Replaces mobile-icon-*. */
export const ICON_SIZE_CLASSES = {
  xs: "h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4",
  sm: "h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5",
  md: "h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6",
  lg: "h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7",
  xl: "h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10",
} as const;
