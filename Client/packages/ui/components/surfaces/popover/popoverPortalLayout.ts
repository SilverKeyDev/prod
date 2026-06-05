import type React from "react";

import { getWindow } from "packages/utils/core/platform";

import type { PopoverSide } from "./Popover.types";

export function panelPortalTransform(side: PopoverSide, left: number, top: number): string {
  const base = `translate(${left}px, ${top}px)`;
  if (side === "left") {
    return `${base} translate(-100%, 0)`;
  }
  if (side === "top") {
    return `${base} translate(0, -100%)`;
  }
  if (side === "overlap") {
    return `${base} translate(0, -50%)`;
  }
  return base;
}

export const PANEL_Z_BY_STACK = {
  page: "z-dropdown",
  modal: "z-modal-popover",
} as const;

export type PortalLayout = {
  left: number;
  top: number;
  widthPx?: number;
  /** When true, panel is centered in the viewport (see `side: "viewportCenter"`). */
  viewportCenter?: boolean;
};

export const VIEWPORT_EDGE_INSET_PX = 12;
export const MATCH_TRIGGER_MIN_WIDTH_PX = 280;

export function computePortalLayout(
  triggerRef: React.RefObject<HTMLDivElement | null>,
  side: PopoverSide,
  gap: number,
  options: { matchTriggerWidth: boolean; centerWidePanelMaxPx?: number }
): PortalLayout {
  const win = getWindow();
  const vw = win?.innerWidth ?? 1024;
  const pad = VIEWPORT_EDGE_INSET_PX;

  if (side === "viewportCenter") {
    let widthPx: number;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (options.matchTriggerWidth && rect) {
      widthPx = Math.min(
        Math.max(Math.round(rect.width), MATCH_TRIGGER_MIN_WIDTH_PX),
        vw - 2 * pad
      );
    } else if (options.centerWidePanelMaxPx != null) {
      widthPx = Math.min(options.centerWidePanelMaxPx, vw - 2 * pad);
    } else if (rect) {
      widthPx = Math.min(
        Math.max(Math.round(rect.width), MATCH_TRIGGER_MIN_WIDTH_PX),
        vw - 2 * pad
      );
    } else {
      widthPx = Math.min(400, vw - 2 * pad);
    }
    return { left: 0, top: 0, widthPx, viewportCenter: true };
  }

  if (!triggerRef.current) {
    return { left: 0, top: 0 };
  }
  const rect = triggerRef.current.getBoundingClientRect();

  const clampLeftForWidth = (left: number, widthPx: number) =>
    Math.max(pad, Math.min(left, vw - pad - widthPx));

  if (side === "bottom") {
    let left = rect.left;
    const top = rect.bottom + gap;
    if (options.matchTriggerWidth) {
      const widthPx = Math.min(
        Math.max(Math.round(rect.width), MATCH_TRIGGER_MIN_WIDTH_PX),
        vw - 2 * pad
      );
      left = clampLeftForWidth(left, widthPx);
      return { left, top, widthPx };
    }
    if (options.centerWidePanelMaxPx != null) {
      const widthPx = Math.min(options.centerWidePanelMaxPx, vw - 2 * pad);
      left = rect.left + rect.width / 2 - widthPx / 2;
      left = clampLeftForWidth(left, widthPx);
      return { left, top, widthPx };
    }
    return { left, top };
  }

  if (side === "top") {
    let left = rect.left;
    const top = rect.top - gap;
    if (options.matchTriggerWidth) {
      const widthPx = Math.min(
        Math.max(Math.round(rect.width), MATCH_TRIGGER_MIN_WIDTH_PX),
        vw - 2 * pad
      );
      left = clampLeftForWidth(left, widthPx);
      return { left, top, widthPx };
    }
    if (options.centerWidePanelMaxPx != null) {
      const widthPx = Math.min(options.centerWidePanelMaxPx, vw - 2 * pad);
      left = rect.left + rect.width / 2 - widthPx / 2;
      left = clampLeftForWidth(left, widthPx);
      return { left, top, widthPx };
    }
    return { left, top };
  }

  if (side === "overlap") {
    return {
      left: rect.left,
      top: rect.top + rect.height / 2,
    };
  }

  if (side === "left") {
    return { left: rect.right, top: rect.bottom + gap };
  }

  return { left: rect.left, top: rect.bottom + gap };
}
