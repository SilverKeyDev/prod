import { HEADER_ROW_CONTROL_HEIGHT } from "packages/ui/constants/layout";
import type { getSharedInputTextStyles } from "packages/utils/core/ui/inputStyles";

export const DROPDOWN_OPTION_ROW_HEIGHT_PX = 52;
export const DROPDOWN_SEARCH_HEADER_ESTIMATE_PX = 58;
export const DROPDOWN_MENU_CHROME_PX = 12;
export const MAX_VISIBLE_OPTIONS_CAP = 25;

export function getDropdownVariantStyles(
  variant: "default" | "mobile" | "compact",
  noBorder: boolean,
  error?: string
) {
  const variantStyles = {
    default:
      "border border-border bg-background-surface hover:border-border focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border",
    mobile:
      "mobile-input border border-border bg-background-surface hover:border-border focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border touch-friendly",
    compact:
      "border border-border bg-background-surface hover:border-border focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border",
  };

  const noBorderVariantStyles = {
    default:
      "border-0 bg-background-surface hover:bg-neutral-100/80 focus-within:ring-accent-muted focus-within:border-transparent",
    mobile:
      "mobile-input border-0 bg-background-surface hover:bg-neutral-100/80 focus-within:ring-accent-muted focus-within:border-transparent touch-friendly",
    compact:
      "border-0 bg-background-surface hover:bg-neutral-100/80 focus-within:ring-accent-muted focus-within:border-transparent",
  };

  const triggerVariantStyles =
    noBorder && !error ? noBorderVariantStyles[variant] : variantStyles[variant];

  return triggerVariantStyles;
}

export function getDropdownShellClasses(variant: "default" | "mobile" | "compact") {
  if (variant === "compact") {
    return "flex items-center cursor-pointer";
  }
  return "flex items-center cursor-pointer touch-friendly mobile-input";
}

export function getDropdownTextStyles(
  variant: "default" | "mobile" | "compact",
  getSharedInputTextStylesFn: typeof getSharedInputTextStyles
) {
  if (variant === "compact") {
    return "text-gray-600 text-sm text-left leading-tight disabled:text-gray-400";
  }
  return (getSharedInputTextStylesFn as () => string)();
}

export function getDropdownSizeStyles(
  size: "sm" | "md" | "lg",
  variant: "default" | "mobile" | "compact" = "default"
) {
  if (variant === "compact") {
    const compactSizeStyles = {
      sm: `${HEADER_ROW_CONTROL_HEIGHT} px-3`,
      md: `${HEADER_ROW_CONTROL_HEIGHT} px-4`,
      lg: "h-12 min-h-12 max-h-12 px-5",
    };
    return compactSizeStyles[size];
  }

  const sizeStyles = {
    sm: "h-auto min-h-9 px-3",
    md: "h-auto min-h-12 px-4",
    lg: "h-auto min-h-14 px-5",
  };
  return sizeStyles[size];
}

export function getDropdownErrorStyles(error?: string) {
  return error
    ? "border-neutral-600 focus-within:border-neutral-700 focus-within:ring-neutral-400"
    : "";
}

export function getDropdownDisabledStyles(disabled?: boolean) {
  return disabled ? "bg-disabled text-text-disabled cursor-not-allowed" : "cursor-pointer";
}

export function buildDropdownButtonClasses(
  getSharedInputTextStylesFn: typeof getSharedInputTextStyles,
  variant: "default" | "mobile" | "compact",
  size: "sm" | "md" | "lg",
  noBorder: boolean,
  error?: string,
  disabled?: boolean,
  className?: string
) {
  const triggerVariantStyles = getDropdownVariantStyles(variant, noBorder, error);
  const shellClasses = getDropdownShellClasses(variant);
  const textStyles = getDropdownTextStyles(variant, getSharedInputTextStylesFn);
  const sizeStyles = getDropdownSizeStyles(size, variant);
  const errorStyles = getDropdownErrorStyles(error);
  const disabledStyles = getDropdownDisabledStyles(disabled);

  return [
    "w-full rounded-lg transition-all duration-200 focus-within:outline-none focus-within:ring-2",
    shellClasses,
    "disabled:bg-disabled disabled:text-text-disabled disabled:cursor-not-allowed",
    textStyles,
    triggerVariantStyles,
    sizeStyles,
    errorStyles,
    disabledStyles,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildDropdownMenuClasses(
  dropdownClassName: string,
  menuPortalStack: "page" | "modal"
) {
  const menuSurfaceClasses = [
    "flex max-h-full min-h-0 flex-col overflow-hidden",
    "border border-neutral-200 bg-background-surface/90 shadow-lg backdrop-blur-sm rounded-lg",
    dropdownClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const portalZClass = menuPortalStack === "modal" ? "z-modal-popover" : "z-dropdown";
  const portalMenuClasses = `${menuSurfaceClasses} ${portalZClass}`;

  return { menuSurfaceClasses, portalMenuClasses };
}

export function buildInlineDropdownClasses(
  menuPlacement: "below" | "above" | "overlap",
  menuSurfaceClasses: string
) {
  const inlineDropdownPlacementClasses =
    menuPlacement === "overlap"
      ? "absolute left-0 right-0 top-1/2 z-dropdown -translate-y-1/2"
      : menuPlacement === "above"
        ? "absolute bottom-full left-0 right-0 mb-1 z-dropdown"
        : "absolute top-full left-0 right-0 mt-1 z-dropdown";

  return [inlineDropdownPlacementClasses, menuSurfaceClasses].filter(Boolean).join(" ");
}
