/**
 * Unified sidebar styling (chrome + inset). All class strings use design tokens
 * from `packages/design-tokens/tokens/colors.json` — no raw `neutral-*` in sidebar UI.
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
  return "flex items-center justify-center rounded-lg p-1.5 text-text-secondary transition hover:bg-primary-muted hover:text-text-primary";
}

export function sidebarInsetHeaderMenuToggleClass(): string {
  return "inline-flex items-center justify-center rounded-lg p-2 text-text-secondary transition hover:bg-primary-muted focus:outline-none xl:hidden";
}

export function sidebarInsetHeaderGhostButtonClass(): string {
  return "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-text-secondary transition hover:bg-primary-muted hover:text-text-primary";
}

export function sidebarInsetHeaderCollapseButtonClass(): string {
  return "inline-flex items-center justify-center rounded-lg bg-primary-muted px-3 py-2 text-text-primary transition hover:bg-accent-muted xl:hidden";
}

/** List rows inside inset scroll areas */
export function sidebarInsetListRowClass(selected: boolean): string {
  const base =
    "border-border group cursor-pointer border-b p-3 transition-colors hover:bg-primary-muted/70";
  return selected
    ? `${base} border-l-olive bg-olive/10 border-l-4 hover:bg-olive/15`
    : base;
}

/** Native flat list row: token-aligned inset list surface + touch feedback */
export const SIDEBAR_INSET_LIST_ROW_FLAT_NATIVE =
  "border-border border-b px-4 py-4 active:bg-primary-muted/70";

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
  const baseStyles =
    "w-full flex items-center py-3 transition-all duration-200 font-medium touch-friendly rounded-lg";
  const hoverActiveStyles = "bg-sidebar-accent hover:bg-sidebar-accent";
  const activeStyles = `${hoverActiveStyles} text-sidebar-foreground font-bold`;
  const inactiveStyles = `text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground hover:-translate-y-0.5 active:bg-sidebar-accent active:text-sidebar-foreground`;
  return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
}

/**
 * Nested items on dark chrome (dashboard sidebar sub-links).
 */
export function getChromeNavSubItemStyles(isActive: boolean): string {
  const baseStyles =
    "flex items-center transition-all duration-200 font-medium touch-friendly rounded-lg";
  const hoverActiveStyles = "bg-sidebar-accent hover:bg-sidebar-accent";
  const activeStyles = `${hoverActiveStyles} text-sidebar-foreground font-bold`;
  const inactiveStyles = `text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground hover:-translate-y-0.5 active:bg-sidebar-accent active:text-sidebar-foreground`;
  return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
}

export type SidebarInsetNavOptions = {
  active: boolean;
  disabled?: boolean;
};

/**
 * Ghost nav rows on light surfaces (settings / personalization sidebars).
 */
export function getInsetNavItemClasses({ active, disabled = false }: SidebarInsetNavOptions): string {
  const base =
    "group flex min-h-9 w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors";
  if (disabled) {
    return `${base} cursor-not-allowed bg-disabled text-text-disabled`;
  }
  if (active) {
    return `${base} !bg-primary-muted !text-text-primary hover:!bg-primary-muted hover:!font-semibold hover:!text-text-primary active:!bg-primary-muted active:!font-semibold active:!text-text-primary`;
  }
  return `${base} text-text-secondary hover:!bg-primary-muted hover:text-text-primary active:!bg-primary-muted active:text-text-primary`;
}

export function getInsetNavItemIconClasses(active: boolean): string {
  return `size-5 flex-shrink-0 transition-colors ${
    active
      ? "!text-text-primary group-hover:!text-text-primary"
      : "text-text-secondary group-hover:text-text-primary"
  }`;
}

export function getInsetNavItemLabelClasses(active: boolean): string {
  return `text-left text-sm font-medium transition-colors ${
    active
      ? "!text-text-primary group-hover:!font-semibold group-hover:!text-text-primary"
      : "text-text-secondary group-hover:text-text-primary"
  }`;
}
