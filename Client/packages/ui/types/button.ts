/**
 * Button variant style mappings (Tailwind class strings).
 * Single source of truth for button styles; "cancel" is not a style (alias to ghost in Button).
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
  "bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow active:bg-primary-hover focus:ring-neutral-400 disabled:bg-disabled disabled:text-text-disabled disabled:shadow-none";
const FILLED_TERTIARY =
  "bg-accent text-white shadow-sm hover:bg-accent-hover hover:shadow active:bg-accent-hover focus:ring-neutral-400 disabled:bg-disabled disabled:text-text-disabled disabled:shadow-none";
const FILLED_DANGER =
  "bg-destructive text-white shadow-sm hover:bg-destructive-hover hover:shadow active:bg-destructive-hover focus:ring-neutral-400 disabled:bg-disabled disabled:text-text-disabled disabled:shadow-none";
const FILLED_SUCCESS =
  "bg-accent text-white shadow-sm hover:bg-accent-hover hover:shadow active:bg-accent-hover focus:ring-neutral-400 disabled:bg-disabled disabled:text-text-disabled disabled:shadow-none";

const VARIANT_SECONDARY =
  "bg-neutral-100 text-text-primary hover:bg-neutral-200 active:bg-neutral-300 focus:ring-neutral-400 disabled:bg-neutral-100 disabled:text-text-disabled";

/** Outline/ghost on light backgrounds: neutral text (never olive-on-white). Filled variants (primary, danger, etc.) keep white text. */
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
