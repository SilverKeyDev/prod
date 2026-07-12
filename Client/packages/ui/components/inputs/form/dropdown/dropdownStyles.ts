import { HEADER_ROW_CONTROL_HEIGHT } from "packages/ui/constants/layout";
import type { getSharedInputTextStyles } from "packages/utils/core/ui/inputStyles";

/** ~40px: py-2 (16) + text line — industry-standard menu row (Radix/shadcn/Tailwind UI). */
export const DROPDOWN_OPTION_ROW_HEIGHT_PX = 40;
export const DROPDOWN_SEARCH_HEADER_ESTIMATE_PX = 58;
export const DROPDOWN_MENU_CHROME_PX = 12;
export const MAX_VISIBLE_OPTIONS_CAP = 25;

/**
 * Full-bleed option row: no Button focus ring/offset — selection/hover fill the entire row edge-to-edge.
 * Padding matches common select menus (12×8).
 */
export const DROPDOWN_OPTION_ROW_BASE_CLASSES =
  "touch-friendly flex w-full items-center justify-between gap-2 rounded-none px-3 py-2 text-left outline-none transition-colors duration-150 hover:font-normal focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 active:bg-neutral-100";

export function getDropdownVariantStyles(
  variant: "default" | "mobile" | "compact",
  noBorder: boolean,
  error?: string
) {
  const variantStyles = {
    default:
      "border border-border bg-background-surface hover:border-border focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border",
    mobile:
      "border border-border bg-background-surface hover:border-border focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border touch-friendly",
    compact:
      "border border-border bg-background-surface hover:border-border focus-within:ring-neutral-400 focus-within:border-input-variant-focus-border",
  };

  const noBorderVariantStyles = {
    default:
      "border-0 bg-background-surface hover:bg-neutral-100/80 focus-within:ring-accent-muted focus-within:border-transparent",
    mobile:
      "border-0 bg-background-surface hover:bg-neutral-100/80 focus-within:ring-accent-muted focus-within:border-transparent touch-friendly",
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
  return "flex items-center cursor-pointer touch-friendly";
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

  // Match Select / FieldShell: fixed height + horizontal padding only (no escalating py).
  const sizeStyles = {
    sm: "h-9 min-h-9 px-3",
    md: "h-12 min-h-12 px-4",
    lg: "h-14 min-h-14 px-5",
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
    // Focus ring lives on this shell (full trigger circumference), not on the inner Button.
    "group w-full rounded-lg transition-all duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0",
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

/** Suppress Button/IconButton focus chrome when nested inside the dropdown trigger shell. */
export const DROPDOWN_TRIGGER_INNER_FOCUS_RESET =
  "outline-none ring-0 ring-offset-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0";

/** Autocomplete / places suggestion list — no inter-item gap so highlight is edge-to-edge. */
export const DROPDOWN_SUGGESTION_LIST_CLASSES =
  "bg-background-surface z-dropdown relative mt-1 flex max-h-60 flex-col overflow-hidden overflow-y-auto rounded-md border border-neutral-200 shadow-sm";

/** Suggestion option Button: full-bleed fill, no ring offset. */
export const DROPDOWN_SUGGESTION_OPTION_CLASSES = `${DROPDOWN_OPTION_ROW_BASE_CLASSES} w-full cursor-pointer !justify-start text-sm [&>div>div]:!justify-start [&>div>div]:!text-left [&>div]:w-full [&>div]:!justify-start`;

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
