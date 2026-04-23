/**
 * Typography tokens for Text primitive / NativeWind variants.
 */

export type TextVariant =
  | "body"
  | "body-sm"
  | "body-xs"
  | "caption"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "label";

export type TypographyVariantConfig = {
  sizeClass: string;
  lineHeightMultiplier: number;
  fontWeight: number;
};
