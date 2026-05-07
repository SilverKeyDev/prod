import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";
import { getDocument, getWindow } from "packages/utils/platform";

import type { PopoverProps, PopoverSide } from "./Popover.types";
import { PopoverContextProvider } from "./PopoverContext";
import { usePopoverState } from "./usePopoverState";

function panelPortalTransform(side: PopoverSide, left: number, top: number): string {
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

/**
 * Minimal popover: trigger + panel that closes on outside click and Escape.
 * Panel position uses getBoundingClientRect when usePortal is true (`side`: bottom, top, left, or overlap).
 */
const PANEL_Z_BY_STACK = {
  page: "z-dropdown",
  modal: "z-modal-popover",
} as const;

type PortalLayout = {
  left: number;
  top: number;
  widthPx?: number;
  /** When true, panel is centered in the viewport (see `side: "viewportCenter"`). */
  viewportCenter?: boolean;
};

const VIEWPORT_EDGE_INSET_PX = 12;
const MATCH_TRIGGER_MIN_WIDTH_PX = 280;

function computePortalLayout(
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

export default function Popover({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  usePortal = true,
  side = "bottom",
  panelClassName = "",
  panelMaxHeight,
  panelMinWidth,
  matchTriggerWidth = false,
  centerWidePanelMaxPx,
  className = "",
  triggerWrapperClassName = "",
  panelStack = "page",
}: PopoverProps): React.ReactElement {
  const panelZ = PANEL_Z_BY_STACK[panelStack];
  const { open, onToggle, onClose } = usePopoverState(controlledOpen, onOpenChange);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const outsideSafeTargetsRef = useRef(new Set<HTMLElement>());
  const panelId = useId();
  const [portalLayout, setPortalLayout] = useState<PortalLayout | null>(null);

  const registerOutsideClickSafeTarget = useCallback((element: HTMLElement) => {
    outsideSafeTargetsRef.current.add(element);
    return () => {
      outsideSafeTargetsRef.current.delete(element);
    };
  }, []);

  // Escape key (guarded for RN)
  useEffect(() => {
    if (!open) return;
    const doc = getDocument();
    if (!doc) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const triggerEl = triggerRef.current;
        const first =
          triggerEl?.querySelector<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          ) ?? (triggerEl as HTMLElement);
        first?.focus();
        onClose();
      }
    };
    doc.addEventListener("keydown", handleKeyDown);
    return () => doc.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      outsideSafeTargetsRef.current.clear();
    }
  }, [open]);

  // Click / touch outside (guarded for RN)
  useEffect(() => {
    if (!open) return;
    const doc = getDocument();
    if (!doc) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const node = (e.target as Node) ?? null;
      if (!node) return;
      if (triggerRef.current?.contains(node) || panelRef.current?.contains(node)) {
        return;
      }
      for (const el of outsideSafeTargetsRef.current) {
        if (el.contains(node)) {
          return;
        }
      }
      const triggerEl = triggerRef.current;
      const first =
        triggerEl?.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? (triggerEl as HTMLElement);
      first?.focus();
      onClose();
    };
    const handler = (e: MouseEvent) => handleClickOutside(e);
    const touchHandler = (e: TouchEvent) => handleClickOutside(e);
    doc.addEventListener("mousedown", handler);
    doc.addEventListener("touchstart", touchHandler, { passive: true });
    return () => {
      doc.removeEventListener("mousedown", handler);
      doc.removeEventListener("touchstart", touchHandler);
    };
  }, [open, onClose]);

  // Focus first focusable in panel when opening (web only)
  useEffect(() => {
    if (!open) return;
    const win = getWindow();
    if (!win || typeof win.requestAnimationFrame !== "function") return;
    const id = win.requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });
    return () => {
      if (win.cancelAnimationFrame) win.cancelAnimationFrame(id);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !usePortal) {
      setPortalLayout(null);
      return;
    }
    const update = () => {
      setPortalLayout(
        computePortalLayout(triggerRef, side, 8, {
          matchTriggerWidth: Boolean(matchTriggerWidth),
          centerWidePanelMaxPx,
        })
      );
    };
    update();
    const win = getWindow();
    if (!win) {
      return;
    }
    win.addEventListener("scroll", update, true);
    win.addEventListener("resize", update);
    return () => {
      win.removeEventListener("scroll", update, true);
      win.removeEventListener("resize", update);
    };
  }, [open, usePortal, side, matchTriggerWidth, centerWidePanelMaxPx]);

  const panelStyle: React.CSSProperties = {};
  if (panelMaxHeight) panelStyle.maxHeight = panelMaxHeight;
  const layoutWidthPx = portalLayout?.widthPx;
  if (layoutWidthPx != null) {
    panelStyle.width = `${layoutWidthPx}px`;
    panelStyle.boxSizing = "border-box";
  } else if (panelMinWidth) {
    panelStyle.minWidth = panelMinWidth;
  }

  const panelContent = open ? (
    <Box
      ref={panelRef}
      id={panelId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${panelId}-title`}
      className={`border-border bg-background-surface ${panelZ} overflow-y-auto rounded-lg border shadow-lg ${panelClassName}`}
      style={panelStyle}
    >
      <PopoverContextProvider
        registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
        panelStack={panelStack}
      >
        {children({ onClose, panelId, registerOutsideClickSafeTarget })}
      </PopoverContextProvider>
    </Box>
  ) : null;

  return (
    <Box className={`relative flex flex-row ${className}`.trim()}>
      <Box ref={triggerRef} className={triggerWrapperClassName || undefined} tabIndex={-1}>
        {trigger({ open, onToggle, panelId })}
      </Box>
      {usePortal && open ? (
        <Portal>
          {panelStack === "modal" ? (
            <Box aria-hidden className="z-modal-popover-underlay fixed inset-0 bg-transparent" />
          ) : null}
          <PanelPortal
            panelZ={panelZ}
            layout={
              portalLayout ??
              (side === "viewportCenter"
                ? { left: 0, top: 0, viewportCenter: true }
                : { left: 0, top: 0 })
            }
            side={side}
          >
            {panelContent}
          </PanelPortal>
        </Portal>
      ) : (
        open &&
        (side === "viewportCenter" ? (
          <Box
            className={`${panelZ} pointer-events-none fixed inset-0 flex items-center justify-center p-3 sm:p-4`}
          >
            <Box className="pointer-events-auto flex w-full justify-center">{panelContent}</Box>
          </Box>
        ) : (
          <Box
            className={
              side === "overlap"
                ? `${panelZ} absolute left-0 top-1/2 -translate-y-1/2`
                : side === "top"
                  ? `${panelZ} absolute bottom-full left-0 mb-1`
                  : `${panelZ} absolute left-0 top-full mt-1`
            }
          >
            {panelContent}
          </Box>
        ))
      )}
    </Box>
  );
}

function PanelPortal({
  panelZ,
  layout,
  side,
  children,
}: {
  panelZ: string;
  layout: PortalLayout;
  side: PopoverSide;
  children: React.ReactNode;
}): React.ReactElement {
  if (layout.viewportCenter) {
    return (
      <Box
        className={`${panelZ} pointer-events-none fixed inset-0 flex items-center justify-center p-3 sm:p-4`}
      >
        <Box className="pointer-events-auto flex w-full justify-center">{children}</Box>
      </Box>
    );
  }

  const transform = panelPortalTransform(side, layout.left, layout.top);

  return (
    <Box className={`${panelZ} fixed left-0 top-0`} style={{ transform }}>
      {children}
    </Box>
  );
}
