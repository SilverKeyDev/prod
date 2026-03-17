/**
 * StatusBadge variant and size styles — single source of truth for web and native.
 * Platform files must import from here; they must NOT define local baseStyles, etc.
 */

export type StatusBadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "processing"
  | "default";

export type StatusBadgeSize = "xs" | "sm" | "md" | "lg";

export const STATUS_BADGE_BASE_STYLES = "flex flex-row px-2 py-1 rounded-full font-medium";

export const STATUS_BADGE_SIZE_STYLES: Record<StatusBadgeSize, string> = {
  xs: "text-xs px-1.5 py-0.5",
  sm: "text-xs px-2 py-1",
  md: "text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5",
  lg: "text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2",
};

export const STATUS_BADGE_VARIANT_STYLES: Record<StatusBadgeVariant, string> = {
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-destructive text-white",
  info: "bg-blue-100 text-blue-800",
  processing: "bg-accent text-white",
  default: "bg-neutral-100 text-neutral-800",
};
