/**
 * Modal panel variant and size styles - single source of truth for web and native.
 * Platform files (.web, .native) must import from here; they must NOT define local
 * SIZE_STYLES, panelClasses, etc.
 *
 * Shared (web + native): MODAL_PANEL_BORDER_*, MODAL_PANEL_FOOTER_BASE
 * Web-only: MODAL_*_WEB (layout differs: flex-col, responsive padding)
 * Native-only: MODAL_*_NATIVE (layout differs: flex-row header, fixed padding)
 */

export type ModalSize = "xs" | "sm" | "md" | "lg" | "xl" | "full";

/** Shared border color - use for header and footer borders on both platforms */
export const MODAL_PANEL_BORDER_COLOR = "border-neutral-200";

/** Web: max-width and margin for panel sizing */
export const MODAL_SIZE_STYLES_WEB: Record<ModalSize, string> = {
  xs: "max-w-xs mx-responsive-sm",
  sm: "max-w-sm mx-responsive-sm",
  md: "max-w-md sm:max-w-lg mx-responsive-md",
  lg: "max-w-lg sm:max-w-xl mx-responsive-md",
  xl: "max-w-xl sm:max-w-2xl mx-responsive-lg",
  full: "max-w-full mx-responsive-sm",
};

/** Web: panel base + content background */
export const MODAL_PANEL_BASE_WEB =
  "relative flex flex-row min-h-0 w-full max-w-full transform flex-col overflow-hidden rounded-lg text-left shadow-xl sm:rounded-xl";

export const MODAL_PANEL_HEADER_WEB =
  "flex flex-row flex-row min-h-0 flex-shrink-0 items-center justify-between gap-2 overflow-hidden p-3 sm:p-4 md:p-6";

export const MODAL_PANEL_HEADER_BORDER_WEB = `border-b ${MODAL_PANEL_BORDER_COLOR}`;

export const MODAL_PANEL_BODY_WEB =
  "min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6";

/** Shared footer base - both platforms */
export const MODAL_PANEL_FOOTER_BASE = `flex-shrink-0 border-t ${MODAL_PANEL_BORDER_COLOR}`;

export const MODAL_PANEL_FOOTER_WEB = `${MODAL_PANEL_FOOTER_BASE} p-3 sm:p-4 md:p-6`;

/** Native: panel base (different layout - flex-row header) */
export const MODAL_PANEL_BASE_NATIVE =
  "min-w-[280px] max-h-[90%] overflow-hidden rounded-xl bg-neutral-50";

/** Native: size-specific width classes */
export function getModalPanelSizeClassesNative(size: ModalSize): string {
  const isLarge = ["xl", "full"].includes(size);
  const isFull = size === "full";
  return [isLarge && "w-[95%] max-w-[600px]", isFull && "w-[95%] max-w-full"]
    .filter(Boolean)
    .join(" ");
}

export const MODAL_PANEL_HEADER_NATIVE =
  "flex-row items-center justify-between gap-2 overflow-hidden p-3 sm:p-4";

export const MODAL_PANEL_HEADER_BORDER_NATIVE = `border-b ${MODAL_PANEL_BORDER_COLOR}`;

export const MODAL_PANEL_BODY_BASE_NATIVE = "p-4 max-h-[400px]";

export const MODAL_PANEL_BODY_LARGE_NATIVE = "max-h-[700px]";

export const MODAL_PANEL_FOOTER_NATIVE = `${MODAL_PANEL_FOOTER_BASE} p-4`;

export const MODAL_BACKDROP_NATIVE =
  "flex-1 items-center justify-center bg-neutral-900 p-4";
