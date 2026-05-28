import type { ReactNode } from "react";

export type PopoverSide = "left" | "bottom" | "top" | "overlap" | "viewportCenter";

/**
 * Shared props for Popover across web and native.
 * Web: usePortal, side, panelClassName affect positioning.
 * Native: usePortal and side are ignored (Modal-based); panelClassName maps to style.
 */
export type PopoverProps = {
  /** Optional accessible name when no titled element uses `${panelId}-title`. */
  label?: string;
  /** Trigger element (e.g. button); receives open state, toggle, and optional panelId for aria-controls */
  trigger: (props: { open: boolean; onToggle: () => void; panelId?: string }) => ReactNode;
  /** Panel content; receives close callback and panelId for aria-labelledby */
  children: (props: {
    onClose: () => void;
    panelId?: string;
    /**
     * Register a DOM node that is visually part of the panel but rendered in a portal (e.g. Dropdown
     * with menuInPortal). Clicks inside these nodes will not close the popover.
     */
    registerOutsideClickSafeTarget: (element: HTMLElement) => () => void;
  }) => ReactNode;
  /** Whether the popover is open (controlled) */
  open?: boolean;
  /** Called when open state changes (for controlled usage) */
  onOpenChange?: (open: boolean) => void;
  /** Render panel in a portal (default true on web; ignored on native - always uses Modal) */
  usePortal?: boolean;
  /** Where the panel opens: "bottom" (default), "top", "left", "overlap" (on trigger), or "viewportCenter" (fixed, centered in the window — avoids clipping in nested modals). Ignored on native. */
  side?: PopoverSide;
  /** Optional class for the panel container (web: className; native: mapped to style) */
  panelClassName?: string;
  /** Optional max height for scrollable panel (e.g. "85vh") */
  panelMaxHeight?: string;
  /** Optional min width for panel (e.g. "320px") */
  panelMinWidth?: string;
  /**
   * Web + portaled `side` bottom/top: set panel width from the trigger width (min 280px), clamped
   * to the viewport — aligns dropdowns with fields (e.g. date picker in a modal).
   */
  matchTriggerWidth?: boolean;
  /**
   * Web + portaled `side` bottom/top: panel width is `min(maxPx, viewport − inset)` and horizontally
   * centered under the trigger, clamped — for wide panels (e.g. week calendar) without hugging the
   * left edge of the field only.
   */
  centerWidePanelMaxPx?: number;
  /** Optional class for the root wrapper (e.g. "w-full min-w-0") */
  className?: string;
  /** Optional class for the trigger wrapper (e.g. "w-full flex flex-row" so trigger can stretch) */
  triggerWrapperClassName?: string;
  /**
   * Web: stacking for portaled panel. Use `modal` when the trigger lives inside a dialog so the panel
   * stays above `z-modal` (default `page` uses `z-dropdown`, which is below modals).
   */
  panelStack?: "page" | "modal";
};
