import { tailwindNavChromeNavText } from "packages/ui/styles/theme/navTabTypography";
import {
  BUTTON_ICON_LUCIDE_SIZE_PX,
  BUTTON_ICON_SIZE_CLASS,
  BUTTON_LUCIDE_ICON_STROKE_WIDTH,
} from "packages/ui/styles/variants/buttonVariants";

/**
 * Unified sidebar styling (chrome + inset). All class strings use design tokens
 * from merged design-tokens color JSON (foundation + features) — no raw `neutral-*` in sidebar UI.
 */

/** Fixed nav column: app shell, mobile dock */
export const SIDEBAR_CHROME_SHELL = "bg-sidebar text-sidebar-foreground";

/** Bottom border class for tab row on chrome */
export const SIDEBAR_TAB_ROW_BORDER = "border-b border-sidebar-border";
export const SIDEBAR_TAB_ACTIVE_TEXT = "text-sidebar-foreground";
export const SIDEBAR_TAB_INACTIVE_TEXT =
  "text-sidebar-muted-foreground hover:text-sidebar-foreground active:text-sidebar-foreground";
export const SIDEBAR_TAB_LOCKED_TEXT =
  "text-sidebar-muted-foreground opacity-75 hover:text-sidebar-foreground/90 active:opacity-90";
export const SIDEBAR_TAB_ACTIVE_UNDERLINE = "bg-sidebar-foreground";

/** Inset column header (messaging, etc.) */
export const SIDEBAR_INSET_HEADER_SHELL =
  "flex w-full items-center justify-between border-b border-border bg-background-surface p-3 h-14";

export function sidebarInsetHeaderTitleClass(): string {
  return "font-medium text-text-primary";
}

export function sidebarInsetHeaderIconButtonClass(): string {
  return "flex items-center justify-center rounded-lg p-1.5 text-text-secondary transition hover:bg-neutral-100 hover:text-text-primary";
}

export function sidebarInsetHeaderMenuToggleClass(): string {
  return "inline-flex items-center justify-center rounded-lg p-2 text-text-secondary transition hover:bg-neutral-100 focus:outline-none xl:hidden";
}

export function sidebarInsetHeaderGhostButtonClass(): string {
  return "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-text-secondary transition hover:bg-neutral-100 hover:text-text-primary";
}

export function sidebarInsetHeaderCollapseButtonClass(): string {
  return "inline-flex items-center justify-center rounded-lg bg-primary-muted px-3 py-2 text-text-primary transition hover:opacity-90 xl:hidden";
}

/**
 * Selected inset list row (messaging client/agent sidebar).
 * Visual indicator is olive-only via `.sk-inset-row-selected` in `components.css` (::before stripe).
 */
export const SK_INSET_ROW_SELECTED_CLASS = "sk-inset-row-selected";

/** Set on the row element when selected; pairs with {@link SK_INSET_ROW_SELECTED_CLASS}. */
export const SK_INSET_ROW_SELECTED_DATA_ATTR = "data-sk-inset-row-selected";

/** List rows inside inset scroll areas */
export function sidebarInsetListRowClass(selected: boolean): string {
  const base =
    "group relative cursor-pointer border-0 border-b border-border p-3 transition-colors focus-visible:outline-none focus-visible:ring-0";
  if (selected) {
    return `${base} ${SK_INSET_ROW_SELECTED_CLASS} bg-olive/10 hover:bg-olive/15`;
  }
  return `${base} hover:bg-neutral-100`;
}

export function sidebarInsetListRowSelectedProps(selected: boolean): {
  [SK_INSET_ROW_SELECTED_DATA_ATTR]?: "true";
} {
  return selected ? { [SK_INSET_ROW_SELECTED_DATA_ATTR]: "true" } : {};
}

/** Native flat list row: token-aligned inset list surface + touch feedback */
export const SIDEBAR_INSET_LIST_ROW_FLAT_NATIVE =
  "border-border border-b px-4 py-4 active:bg-neutral-100";

export const SIDEBAR_INSET_EMPTY_ICON_WRAP =
  "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted";
export const SIDEBAR_INSET_EMPTY_ICON = "h-6 w-6 text-text-secondary";
export const SIDEBAR_INSET_BODY_MUTED = "text-text-secondary";

export const SIDEBAR_AVATAR_WRAP =
  "h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-primary-muted";

/**
 * Primary nav links on dark chrome (dashboard sidebar).
 */
export function getChromeNavButtonStyles(isActive: boolean): string {
  const { inactive, highlighted } = tailwindNavChromeNavText;
  const baseStyles =
    "w-full flex items-center py-3 transition-all duration-200 touch-friendly rounded-lg";
  const hoverActiveStyles = "bg-sidebar-accent hover:bg-sidebar-accent";
  const activeStyles = `${hoverActiveStyles} text-sidebar-foreground ${highlighted}`;
  const inactiveStyles = `${inactive} text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground hover:-translate-y-0.5 active:bg-sidebar-accent active:text-sidebar-foreground`;
  return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
}

/**
 * Nested items on dark chrome (dashboard sidebar sub-links).
 */
export function getChromeNavSubItemStyles(isActive: boolean): string {
  const { inactive, highlighted } = tailwindNavChromeNavText;
  const baseStyles = "flex items-center transition-all duration-200 touch-friendly rounded-lg";
  const hoverActiveStyles = "bg-sidebar-accent hover:bg-sidebar-accent";
  const activeStyles = `${hoverActiveStyles} text-sidebar-foreground ${highlighted}`;
  const inactiveStyles = `${inactive} text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground hover:-translate-y-0.5 active:bg-sidebar-accent active:text-sidebar-foreground`;
  return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
}

export type SidebarInsetNavOptions = {
  active: boolean;
  disabled?: boolean;
  /**
   * Narrow icon-only rail (no label): drop `gap-3` and horizontal padding so flex gap / padding
   * does not push the icon off center; use with `Button` `contentAlign="center"`.
   */
  iconOnly?: boolean;
};

/**
 * Ghost nav rows on light surfaces (settings / personalization sidebars).
 */
export function getInsetNavItemClasses({
  active,
  disabled = false,
  iconOnly = false,
}: SidebarInsetNavOptions): string {
  /**
   * Inset rows use {@link Button} `variant="ghost"` `size="sm"`, which also applies `touch-friendly`
   * (`p-2`, gray hover/active). Use `!` padding + min height so row rhythm matches the shell and wins
   * over `touch-friendly` / button size utilities (Tailwind merge order is not guaranteed).
   */
  const gapAndPadding = iconOnly ? "gap-0 !justify-center !px-0 !py-2" : "gap-3 !px-3 !py-2";
  const base = `group flex !min-h-touch w-full min-w-0 items-center ${gapAndPadding} rounded-lg transition-colors`;
  if (disabled) {
    return `${base} cursor-not-allowed bg-disabled text-text-disabled`;
  }
  if (active) {
    return `${base} !bg-neutral-100 !font-semibold !text-text-primary hover:!bg-neutral-200 hover:!text-text-primary active:!bg-neutral-200 active:!text-text-primary focus-visible:!ring-0 focus-visible:!ring-offset-0`;
  }
  return `${base} text-text-primary hover:!bg-background-surface hover:text-text-primary active:!bg-neutral-100 active:text-text-primary`;
}

export function getInsetNavItemIconClasses(active: boolean): string {
  const sizeClass = active ? BUTTON_ICON_SIZE_CLASS.lg : BUTTON_ICON_SIZE_CLASS.sm;
  return `${sizeClass} flex-shrink-0 transition-colors ${
    active
      ? "!text-text-primary group-hover:!text-text-primary"
      : "text-text-primary group-hover:text-text-primary"
  }`;
}

/** Lucide / shared `Icon` `size` — use with {@link getInsetNavItemIconClasses}. */
export function getInsetNavItemIconLucideSizePx(active: boolean): number {
  return active ? BUTTON_ICON_LUCIDE_SIZE_PX.lg : BUTTON_ICON_LUCIDE_SIZE_PX.sm;
}

/** Lucide `strokeWidth` — use with {@link getInsetNavItemIconClasses}. */
export function getInsetNavItemIconStrokeWidth(active: boolean): number {
  return active
    ? BUTTON_LUCIDE_ICON_STROKE_WIDTH.emphasized
    : BUTTON_LUCIDE_ICON_STROKE_WIDTH.default;
}

export function getInsetNavItemLabelClasses(active: boolean): string {
  const { inactive, highlighted } = tailwindNavChromeNavText;
  return `text-left !leading-snug transition-colors ${
    active
      ? `${highlighted} !text-text-primary group-hover:!text-text-primary`
      : `${inactive} !text-text-primary group-hover:!text-text-primary`
  }`;
}
