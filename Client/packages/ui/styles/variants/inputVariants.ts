/**
 * Input variant, size, and base styles - single source of truth for web and native.
 * Platform files (.web, .native) must import from here; they must NOT define local
 * baseStyles, variantStyles, sizeStyles, etc.
 *
 * Unified raw Tailwind strings - no @apply CSS classes. Same string for both web and native.
 * Use getInputClasses() for composed input styling; use getSharedInputTextStyles for raw text styles.
 */

import { getSharedInputTextStyles } from "packages/utils/ui/inputStyles";

export type InputVariant = "default" | "mobile" | "compact" | "search";
export type InputSize = "sm" | "md" | "lg";

/**
 * WebKit/Mozilla autofill styling - warm gold (see `utilities.css` `.autofill-gold`).
 * Use on all text-like form controls for consistent autofill with login/auth.
 */
export const INPUT_AUTOFILL_CLASS_NAME = "autofill-gold";

/** Unified input base - mobile-first. Uses semantic tokens for web/native parity. */
export const INPUT_BASE_CLASSES =
  "w-full rounded-lg border border-border-input bg-background-surface px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3.5 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ring-input-focus focus:border-border-input-focus disabled:bg-disabled disabled:text-text-disabled touch-friendly " +
  INPUT_AUTOFILL_CLASS_NAME;

/** With left icon - replaces .mobile-input.has-left-icon */
export const INPUT_LEFT_ICON_PADDING = "pl-10 sm:pl-11 md:pl-12";

/** With right icon - replaces .mobile-input.has-right-icon */
export const INPUT_RIGHT_ICON_PADDING = "pr-10 sm:pr-11 md:pr-12";

/** Shared base for form inputs and selects (legacy; uses INPUT_BASE_CLASSES) */
export const FORM_FIELD_BASE_STYLES = INPUT_BASE_CLASSES;

/** Base styles for form inputs (adds placeholder; same as INPUT_BASE_CLASSES) */
export const INPUT_BASE_STYLES = INPUT_BASE_CLASSES;

/** Select-specific: appearance-none bg-white */
export const SELECT_EXTRA_CLASSES = "appearance-none bg-white";

export const INPUT_VARIANT_STYLES: Record<InputVariant, string> = {
  default:
    "border-border-input bg-white hover:bg-neutral-100 active:bg-neutral-100 focus:ring-neutral-400 focus:border-input-variant-focus-border",
  mobile:
    "border-border-input bg-white hover:bg-neutral-100 active:bg-neutral-100 focus:ring-neutral-400 focus:border-input-variant-focus-border touch-friendly",
  compact:
    "border-border-input bg-white hover:bg-neutral-100 active:bg-neutral-100 focus:ring-neutral-400 focus:border-input-variant-focus-border",
  search:
    "border-border-input bg-white hover:bg-neutral-100 active:bg-neutral-100 focus:ring-neutral-400 focus:border-input-variant-focus-border",
};

/** FieldShell: focus-within for nested inputs (same visual as INPUT_VARIANT_STYLES) */
export const FIELD_SHELL_VARIANT_STYLES: Record<InputVariant, string> = {
  default:
    "border-border-input bg-white hover:bg-neutral-100 active:bg-neutral-100 focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border",
  mobile:
    "border-border-input bg-white hover:bg-neutral-100 active:bg-neutral-100 focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border touch-friendly autofill-parent",
  compact:
    "border-border-input bg-white hover:bg-neutral-100 active:bg-neutral-100 focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border",
  search:
    "border-border-input bg-white hover:bg-neutral-100 active:bg-neutral-100 focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border",
};

/** Unified size classes - min-h for RN flex flex-row compatibility; same for web and native */
export const INPUT_SIZE_STYLES: Record<InputSize, string> = {
  sm: "min-h-9",
  md: "min-h-12",
  lg: "min-h-14",
};

export const INPUT_ERROR_STYLES =
  "border-neutral-600 focus:border-neutral-700 focus:ring-neutral-400";

/** FieldShell: focus-within for nested inputs */
export const FIELD_SHELL_ERROR_STYLES =
  "border-neutral-600 focus-within:border-neutral-700 focus-within:ring-neutral-400";

export const INPUT_CONTAINER_CLASSES = "relative";

export const INPUT_ICON_CLASSES = {
  left: "absolute left-3 top-1/2 -translate-y-1/2 z-10 text-text-secondary",
  right: "absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary",
};

/** FieldShell/Input: left icon wrapper with pointer-events-none (static for NativeWind) */
export const INPUT_LEFT_ICON_WRAPPER_CLASSES =
  "absolute left-3 top-1/2 -translate-y-1/2 z-10 text-text-secondary pointer-events-none";

/** FieldShell/Input: right icon wrapper with pointer-events-none (static for NativeWind) */
export const INPUT_RIGHT_ICON_WRAPPER_CLASSES =
  "absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none z-10";

/** Input.native: right icon container with icon group (static for NativeWind) */
export const INPUT_RIGHT_ICON_GROUP_WRAPPER_CLASSES =
  "absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary flex flex-row flex-row items-center gap-1";

/** Inner flex flex-row container for right-side icon group (clear, password toggle, custom) */
export const INPUT_ICON_GROUP_CLASSES =
  "flex flex-row flex-row items-center gap-1";

/** Display box - read-only cells (profile sections). Mobile-first, same base as input. */
export const DISPLAY_BOX_CLASSES =
  "w-full rounded-lg border border-border-input bg-background-surface px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3.5 text-sm sm:text-base text-text-primary touch-friendly";

/** Display box with gray background - common read-only variant. */
export const DISPLAY_BOX_READONLY_CLASSES = `${DISPLAY_BOX_CLASSES} bg-primary-muted`;

/** Re-export for consumers that need raw text styles */
export { getSharedInputTextStyles } from "packages/utils/ui/inputStyles";

/** Label wrapper classes (mb-2 for spacing; label content uses labelVariants) */
export const INPUT_LABEL_WRAPPER_CLASSES = "mb-2";

/** Error message text - web and native use text-red-600 */
export const INPUT_ERROR_TEXT_CLASSES = "mt-1 text-xs text-red-600";

/** Helper text - web and native use text-text-secondary */
export const INPUT_HELPER_TEXT_CLASSES = "mt-1 text-xs text-text-secondary";

export interface GetInputClassesOptions {
  variant?: InputVariant;
  size?: InputSize;
  error?: boolean;
  hasLeftIcon?: boolean;
  hasRightIcons?: boolean;
  className?: string;
}

/**
 * Composed input classes - single source of truth for both web and native.
 * Always includes getSharedInputTextStyles. Use this instead of manual composition.
 */
export function getInputClasses(options: GetInputClassesOptions = {}): string {
  const {
    variant = "default",
    size = "md",
    error = false,
    hasLeftIcon = false,
    hasRightIcons = false,
    className = "",
  } = options;

  return [
    INPUT_BASE_CLASSES,
    INPUT_VARIANT_STYLES[variant],
    INPUT_SIZE_STYLES[size],
    getSharedInputTextStyles(),
    error && INPUT_ERROR_STYLES,
    hasLeftIcon && INPUT_LEFT_ICON_PADDING,
    hasRightIcons && INPUT_RIGHT_ICON_PADDING,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
