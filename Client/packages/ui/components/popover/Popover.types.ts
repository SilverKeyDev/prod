import type { ReactNode } from "react";

export type PopoverSide = "left" | "bottom" | "top";

/**
 * Shared props for Popover across web and native.
 * Web: usePortal, side, panelClassName affect positioning.
 * Native: usePortal and side are ignored (Modal-based); panelClassName maps to style.
 */
export type PopoverProps = {
  /** Trigger element (e.g. button); receives open state, toggle, and optional panelId for aria-controls */
  trigger: (props: {
    open: boolean;
    onToggle: () => void;
    panelId?: string;
  }) => ReactNode;
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
  /** Where the panel opens relative to the trigger: "left" = to the left, "top" = above, "bottom" = below (default). Ignored on native. */
  side?: PopoverSide;
  /** Optional class for the panel container (web: className; native: mapped to style) */
  panelClassName?: string;
  /** Optional max height for scrollable panel (e.g. "85vh") */
  panelMaxHeight?: string;
  /** Optional min width for panel (e.g. "320px") */
  panelMinWidth?: string;
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
