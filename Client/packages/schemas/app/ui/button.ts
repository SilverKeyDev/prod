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
  "bg-brand-accent text-white shadow-sm hover:bg-brand-accent/90 hover:shadow active:bg-brand-accent/85 focus:ring-brand-accent/25 disabled:bg-brand-accent/50 disabled:text-white/70 disabled:shadow-none";
const FILLED_TERTIARY =
  "bg-gold-muted text-white shadow-sm hover:bg-gold-muted/90 hover:shadow active:bg-gold-muted/85 focus:ring-gold-muted/25 disabled:bg-gold-muted/50 disabled:text-white/70 disabled:shadow-none";
const FILLED_DANGER =
  "bg-rose text-white shadow-sm hover:bg-rose/90 hover:shadow active:bg-rose/85 focus:ring-rose/25 disabled:bg-rose/50 disabled:text-white/70 disabled:shadow-none";
const FILLED_SUCCESS =
  "bg-brand-secondary text-white shadow-sm hover:bg-brand-secondary/90 hover:shadow active:bg-brand-secondary/85 focus:ring-brand-secondary/25 disabled:bg-brand-secondary/50 disabled:text-white/70 disabled:shadow-none";

const VARIANT_SECONDARY =
  "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 focus:ring-neutral-400/25 disabled:bg-neutral-100/70 disabled:text-neutral-500";

/** Outline/ghost on light backgrounds: neutral text (never olive-on-white). Filled variants (primary, danger, etc.) keep white text. */
const VARIANT_OUTLINE =
  "border border-neutral-300 bg-transparent text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 focus:ring-neutral-400/25 disabled:border-neutral-300/70 disabled:text-neutral-500";

const VARIANT_GHOST =
  "bg-transparent text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 focus:ring-neutral-400/25 disabled:text-neutral-500";

export const BUTTON_VARIANT_STYLES: Record<ButtonStyleVariant, string> = {
  primary: FILLED_PRIMARY,
  secondary: VARIANT_SECONDARY,
  tertiary: FILLED_TERTIARY,
  outline: VARIANT_OUTLINE,
  ghost: VARIANT_GHOST,
  danger: FILLED_DANGER,
  success: FILLED_SUCCESS,
};
