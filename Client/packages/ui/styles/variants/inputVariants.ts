/**
 * Input variant, size, and base styles - single source of truth for web and native.
 * Platform files (.web, .native) must import from here; they must NOT define local
 * baseStyles, variantStyles, sizeStyles, etc.
 *
 * Unified raw Tailwind strings - no @apply CSS classes. Same string for both web and native.
 * Use getInputClasses() for composed input styling; use getSharedInputTextStyles for raw text styles.
 */

import { getSharedInputTextStyles } from "packages/utils/core/ui/inputStyles";

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
  left: "absolute left-3 top-1/2 z-header -translate-y-1/2 text-text-secondary",
  right: "absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary",
};

/** FieldShell/Input: left icon wrapper with pointer-events-none (static for NativeWind) */
export const INPUT_LEFT_ICON_WRAPPER_CLASSES =
  "text-text-secondary pointer-events-none absolute left-3 top-1/2 z-header -translate-y-1/2";

/** FieldShell/Input: right icon wrapper with pointer-events-none (static for NativeWind) */
export const INPUT_RIGHT_ICON_WRAPPER_CLASSES =
  "text-text-secondary pointer-events-none absolute right-3 top-1/2 z-header -translate-y-1/2";

/** Input.native: right icon container with icon group (static for NativeWind) */
export const INPUT_RIGHT_ICON_GROUP_WRAPPER_CLASSES =
  "absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary flex flex-row flex-row items-center gap-1";

/** Inner flex flex-row container for right-side icon group (clear, password toggle, custom) */
export const INPUT_ICON_GROUP_CLASSES = "flex flex-row flex-row items-center gap-1";

/** Display box - read-only cells (profile sections). Mobile-first, same base as input. */
export const DISPLAY_BOX_CLASSES =
  "w-full rounded-lg border border-border-input bg-background-surface px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3.5 text-sm sm:text-base text-text-primary touch-friendly";

/** Display box with gray background - common read-only variant. */
export const DISPLAY_BOX_READONLY_CLASSES = `${DISPLAY_BOX_CLASSES} bg-primary-muted`;

/** Re-export for consumers that need raw text styles */
export { getSharedInputTextStyles } from "packages/utils/core/ui/inputStyles";

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

/** Legacy web `h-*` + padding sizes for `Input.web` and `FieldShell` (not min-heights). */
export const WEB_FORM_SIZE_STYLES_LEGACY: Record<InputSize, string> = {
  sm: "h-9 px-3",
  md: "h-12 px-4",
  lg: "h-14 px-5",
};

/** `Input.web` — `focus:` on the control. */
export const WEB_FORM_VARIANT_STYLES_INPUT_FOCUS: Record<InputVariant, string> = {
  default:
    "border-border bg-background-surface hover:bg-neutral-100 focus:ring-neutral-400 focus:border-input-variant-focus-border",
  mobile:
    "mobile-input border-border bg-background-surface hover:bg-neutral-100 focus:ring-neutral-400 focus:border-input-variant-focus-border touch-friendly",
  compact:
    "border-border bg-background-surface hover:bg-neutral-100 focus:ring-neutral-400 focus:border-input-variant-focus-border",
  search:
    "border-border bg-background-surface hover:bg-neutral-100 focus:ring-neutral-400 focus:border-input-variant-focus-border",
};

/** `FieldShell` — `focus-within:` on the wrapper. */
export const WEB_FORM_VARIANT_STYLES_SHELL_FOCUS_WITHIN: Record<InputVariant, string> = {
  default:
    "border-border bg-background-surface hover:bg-neutral-100 focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border",
  mobile:
    "mobile-input border-border bg-background-surface hover:bg-neutral-100 focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border touch-friendly autofill-parent",
  compact:
    "border-border bg-background-surface hover:bg-neutral-100 focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border",
  search:
    "border-border bg-background-surface hover:bg-neutral-100 focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border",
};

const WEB_INPUT_CONTROL_BASE =
  "w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-text-disabled transition-colors duration-150 touch-friendly mobile-input placeholder:text-text-secondary " +
  INPUT_AUTOFILL_CLASS_NAME;

const WEB_FIELD_SHELL_BASE =
  "w-full border rounded-lg transition-all duration-200 focus-within:outline-none focus-within:ring-2 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-text-disabled transition-colors duration-150 touch-friendly mobile-input group";

export interface GetWebInputControlClassesOptions {
  variant?: InputVariant;
  size?: InputSize;
  error?: string | boolean;
  hasLeftIcon?: boolean;
  hasRightIcons?: boolean;
  className?: string;
}

/** Composed classes for `packages/ui/components/inputs/form/Input.web` (`<input>` / `customInput`). */
export function getWebInputControlClasses(options: GetWebInputControlClassesOptions = {}): string {
  const {
    variant = "default",
    size = "md",
    error,
    hasLeftIcon = false,
    hasRightIcons = false,
    className = "",
  } = options;
  const err = Boolean(error);
  return [
    WEB_INPUT_CONTROL_BASE,
    WEB_FORM_VARIANT_STYLES_INPUT_FOCUS[variant],
    WEB_FORM_SIZE_STYLES_LEGACY[size],
    getSharedInputTextStyles(),
    err ? "border-neutral-600 focus:border-neutral-700 focus:ring-neutral-400" : "",
    hasLeftIcon ? "has-left-icon" : "",
    hasRightIcons ? "has-right-icon" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export interface GetWebFieldShellClassesOptions {
  variant?: InputVariant;
  size?: InputSize;
  error?: string | boolean;
  leftIcon?: boolean;
  rightIcon?: boolean;
  fieldClassName?: string;
}

/** Composed classes for `FieldShell` outer field bar (nested inputs + PhoneInput). */
export function getWebFieldShellClasses(options: GetWebFieldShellClassesOptions = {}): string {
  const {
    variant = "mobile",
    size = "md",
    error,
    leftIcon = false,
    rightIcon = false,
    fieldClassName = "",
  } = options;
  const err = Boolean(error);
  return [
    WEB_FIELD_SHELL_BASE,
    WEB_FORM_VARIANT_STYLES_SHELL_FOCUS_WITHIN[variant],
    WEB_FORM_SIZE_STYLES_LEGACY[size],
    err ? "border-neutral-600 focus-within:border-neutral-700 focus-within:ring-neutral-400" : "",
    leftIcon ? "has-left-icon" : "",
    rightIcon ? "has-right-icon" : "",
    fieldClassName,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Legacy web `Input.web` icon offsets (interactive icons — no `pointer-events-none`). */
export const WEB_FORM_INPUT_ICON_CLASSES = {
  left: "absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary",
  right: "absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary",
} as const;

/** `FieldShell` icons sit above the field with `pointer-events-none`. */
export const WEB_FORM_FIELD_SHELL_ICON_CLASSES = {
  left: "text-text-secondary pointer-events-none absolute left-3 top-1/2 z-header -translate-y-1/2 transform",
  right:
    "text-text-secondary pointer-events-none absolute right-3 top-1/2 z-header -translate-y-1/2 transform",
} as const;
