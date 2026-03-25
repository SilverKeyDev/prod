/**
 * Button variant and size styles — single source of truth for web and native.
 * Platform files (.web, .native) must import from here; they must NOT define local
 * VARIANT_CLASSES, SIZE_CLASSES, etc.
 *
 * Unified raw Tailwind strings — no @apply CSS classes. Same string for both web and native.
 */

export type ButtonStyleVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";

const FILLED_PRIMARY =
  "bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow active:bg-primary-hover active:shadow web:active:scale-[0.98] focus:ring-neutral-400 disabled:bg-disabled disabled:text-text-disabled disabled:shadow-none";
const FILLED_TERTIARY =
  "border-2 border-black bg-accent text-white shadow-sm hover:bg-accent-hover hover:shadow active:bg-accent-hover active:shadow focus:ring-neutral-400 disabled:bg-gold-locked disabled:text-white disabled:shadow-none disabled:border-neutral-400";
const FILLED_DANGER =
  "bg-destructive text-white shadow-sm hover:bg-destructive-hover hover:shadow active:bg-destructive-hover active:shadow focus:ring-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:shadow-none";
const FILLED_SUCCESS =
  "bg-brand-secondary text-white shadow-sm hover:bg-brand-secondary hover:shadow active:bg-brand-secondary active:shadow focus:ring-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:shadow-none";

const VARIANT_SECONDARY =
  "bg-neutral-100 text-text-primary hover:bg-neutral-200 active:bg-neutral-300 focus:ring-neutral-400 disabled:bg-neutral-100 disabled:text-text-disabled";

const VARIANT_OUTLINE =
  "border border-border bg-transparent text-text-primary hover:bg-neutral-100 active:bg-neutral-200 focus:ring-neutral-400 disabled:border-border disabled:text-text-disabled";

const VARIANT_GHOST =
  "bg-transparent text-text-primary hover:bg-neutral-100 active:bg-neutral-200 focus:ring-neutral-400 disabled:text-text-disabled";

export const BUTTON_VARIANT_STYLES: Record<ButtonStyleVariant, string> = {
  primary: FILLED_PRIMARY,
  secondary: VARIANT_SECONDARY,
  tertiary: FILLED_TERTIARY,
  outline: VARIANT_OUTLINE,
  ghost: VARIANT_GHOST,
  danger: FILLED_DANGER,
  success: FILLED_SUCCESS,
};

/**
 * Applied when `loading` is true. Uses `!` so fill/border wins over base variant utilities.
 * Lighter fill + dark rim; `BUTTON_LOADING_FRAME_CLASSES` adds the shared border width.
 */
export const BUTTON_LOADING_FRAME_CLASSES =
  "relative overflow-hidden border-2 !border-neutral-800 !shadow-none";

export const BUTTON_LOADING_VARIANT_OVERRIDES: Record<ButtonStyleVariant, string> = {
  primary: "!bg-primary/70",
  secondary: "!bg-neutral-50",
  tertiary: "!bg-accent/70",
  outline: "!bg-neutral-50",
  ghost: "!bg-neutral-50",
  danger: "!bg-destructive/70",
  success: "!bg-brand-secondary/70",
};

/**
 * Unified size classes — raw Tailwind, same for web and native.
 * Minimum horizontal padding from text/icon to outer rim: 16px (px-4) for sm/md, 20px (px-5) for lg
 * so buttons are never cramped. Native sizing uses buttonNativeSizes (inline styles) since
 * CVA-assembled native: classes don't apply at Babel transform time.
 */
export const BUTTON_SIZE_CLASSES = {
  sm: "px-4 py-1.5 sm:py-2 min-h-8 sm:min-h-9 text-xs sm:text-sm rounded-lg font-medium",
  md: "px-4 py-2 sm:px-5 sm:py-2.5 min-h-10 sm:min-h-11 text-sm sm:text-base rounded-lg font-medium",
  lg: "px-5 py-3 sm:px-6 sm:py-3 min-h-12 sm:min-h-14 text-sm sm:text-base md:text-lg rounded-lg font-medium",
} as const;

export const BUTTON_TEXT_COLOR_CLASSES: Record<ButtonStyleVariant, string> = {
  primary: "text-white",
  secondary: "text-text-primary",
  tertiary: "text-white",
  outline: "text-text-primary",
  ghost: "text-text-primary",
  danger: "text-white",
  success: "text-white",
};

/**
 * Base row layout without main-axis justify — Button appends justify-center,
 * justify-start (contentAlign="start"), or justify-between (icon edge layout).
 */
export const BUTTON_BASE_CLASSES =
  "flex flex-row items-center gap-2 font-medium leading-none focus:outline-none focus:ring-2 focus:ring-offset-2 web:active:translate-y-[0.5px]";

export const BUTTON_ROUNDED_CLASSES: Record<"none" | "sm" | "md" | "lg" | "xl" | "full", string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export const BUTTON_ICON_SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "h-4 w-4 shrink-0",
  md: "h-4 w-4 shrink-0",
  lg: "h-5 w-5 shrink-0",
};

/** Text size classes for button label (shared web/native) */
export const BUTTON_TEXT_SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "text-sm",
  md: "text-sm",
  lg: "text-sm sm:text-base",
};
