/**
 * Typography variant styles — maps TextVariant to Tailwind classes.
 * Web and Native both use className (NativeWind on RN).
 * RN font-weight routing (Inter-Bold, etc.) deferred until font loading is configured.
 */

import type { TextVariant, TypographyVariantConfig } from "packages/ui/types/typography";

export const TYPOGRAPHY_VARIANTS: Record<
  TextVariant,
  TypographyVariantConfig & { className: string }
> = {
  "heading-1": {
    sizeClass: "text-3xl sm:text-4xl",
    lineHeightMultiplier: 1.2,
    fontWeight: 700,
    className: "font-serif text-3xl sm:text-4xl font-bold leading-tight",
  },
  "heading-2": {
    sizeClass: "text-2xl sm:text-3xl",
    lineHeightMultiplier: 1.25,
    fontWeight: 700,
    className: "font-serif text-2xl sm:text-3xl font-bold leading-snug",
  },
  "heading-3": {
    sizeClass: "text-xl sm:text-2xl",
    lineHeightMultiplier: 1.3,
    fontWeight: 600,
    className: "font-serif text-xl sm:text-2xl font-semibold leading-snug",
  },
  body: {
    sizeClass: "text-sm sm:text-base md:text-lg",
    lineHeightMultiplier: 1.5,
    fontWeight: 400,
    className: "font-sans text-sm sm:text-base md:text-lg font-normal leading-relaxed",
  },
  "body-sm": {
    sizeClass: "text-sm sm:text-base",
    lineHeightMultiplier: 1.5,
    fontWeight: 400,
    className: "font-sans text-sm sm:text-base font-normal leading-relaxed",
  },
  "body-xs": {
    sizeClass: "text-xs sm:text-sm",
    lineHeightMultiplier: 1.5,
    fontWeight: 400,
    className: "font-sans text-xs sm:text-sm font-normal leading-relaxed",
  },
  caption: {
    sizeClass: "text-xs",
    lineHeightMultiplier: 1.4,
    fontWeight: 400,
    className: "font-sans text-xs font-normal leading-normal text-text-secondary",
  },
  label: {
    sizeClass: "text-sm",
    lineHeightMultiplier: 1.4,
    fontWeight: 500,
    className: "font-sans text-sm font-medium leading-normal",
  },
};

/**
 * Get Tailwind className for a variant. Use in Text primitive.
 */
export function getTypographyClassName(variant: TextVariant): string {
  return TYPOGRAPHY_VARIANTS[variant].className;
}
