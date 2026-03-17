/**
 * Label variant, size, and color styles — single source of truth for web and native.
 * Platform files (.web, .native) must import from here; they must NOT define local
 * baseStyles, variantStyles, sizeStyles, etc.
 */

export type LabelVariant = "default" | "bold" | "medium" | "light";
export type LabelSize = "xs" | "sm" | "md" | "lg";
export type LabelColor = "default" | "black" | "gray" | "emphasis" | "error";

export const LABEL_BASE_STYLES = "flex flex-col";

export const LABEL_VARIANT_STYLES: Record<LabelVariant, string> = {
  default: "font-normal",
  light: "font-light",
  medium: "font-medium",
  bold: "font-semibold",
};

export const LABEL_SIZE_STYLES: Record<LabelSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-sm sm:text-base",
  lg: "text-sm sm:text-base md:text-lg",
};

export const LABEL_COLOR_STYLES: Record<LabelColor, string> = {
  default: "text-gray-700 native:text-neutral-700",
  black: "text-black",
  gray: "text-gray-600",
  emphasis: "text-neutral-800",
  error: "text-red-600",
};

export const LABEL_DISABLED_STYLES = "text-gray-400 cursor-not-allowed";

export const LABEL_REQUIRED_INDICATOR_STYLES = "text-red-500";
