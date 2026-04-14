import React, { useCallback, useEffect, useId, useRef, useState } from "react";

import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";
import { getDocument, getWindow } from "packages/utils/platform";

import type { PopoverProps, PopoverSide } from "./Popover.types";
import { usePopoverState } from "./usePopoverState";

function panelPortalTransform(
  side: PopoverSide,
  left: number,
  top: number,
): string {
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
  className = "",
  triggerWrapperClassName = "",
  panelStack = "page",
}: PopoverProps): React.ReactElement {
  const panelZ = PANEL_Z_BY_STACK[panelStack];
  const { open, onToggle, onClose } = usePopoverState(
    controlledOpen,
    onOpenChange,
  );
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const outsideSafeTargetsRef = useRef(new Set<HTMLElement>());
  const panelId = useId();

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
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
      if (
        triggerRef.current?.contains(node) ||
        panelRef.current?.contains(node)
      ) {
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
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    });
    return () => {
      if (win.cancelAnimationFrame) win.cancelAnimationFrame(id);
    };
  }, [open]);

  const panelStyle: React.CSSProperties = {};
  if (panelMaxHeight) panelStyle.maxHeight = panelMaxHeight;
  if (panelMinWidth) panelStyle.minWidth = panelMinWidth;

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
      {children({ onClose, panelId, registerOutsideClickSafeTarget })}
    </Box>
  ) : null;

  return (
    <Box className={`relative flex flex-row ${className}`.trim()}>
      <Box
        ref={triggerRef}
        className={triggerWrapperClassName || undefined}
        tabIndex={-1}
      >
        {trigger({ open, onToggle, panelId })}
      </Box>
      {usePortal && open ? (
        <Portal>
          <PanelPortal
            panelZ={panelZ}
            triggerRef={triggerRef}
            open={open}
            side={side}
          >
            {panelContent}
          </PanelPortal>
        </Portal>
      ) : (
        open && (
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
        )
      )}
    </Box>
  );
}

function updatePanelPosition(
  triggerRef: React.RefObject<HTMLDivElement | null>,
  side: PopoverSide,
  triggerPanelGap: number,
  setPosition: (p: { top: number; left: number }) => void,
) {
  if (!triggerRef.current) return;
  const rect = triggerRef.current.getBoundingClientRect();
  switch (side) {
    case "left":
      setPosition({ left: rect.right, top: rect.bottom + triggerPanelGap });
      break;
    case "top":
      setPosition({ left: rect.left, top: rect.top - triggerPanelGap });
      break;
    case "overlap":
      setPosition({
        left: rect.left,
        top: rect.top + rect.height / 2,
      });
      break;
    case "bottom":
    default:
      setPosition({ left: rect.left, top: rect.bottom + triggerPanelGap });
      break;
  }
}

function PanelPortal({
  panelZ,
  triggerRef,
  open,
  side,
  children,
}: {
  panelZ: string;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  side: PopoverSide;
  children: React.ReactNode;
}): React.ReactElement {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerPanelGap = 8;

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const win = getWindow();
    if (!win) return;
    updatePanelPosition(triggerRef, side, triggerPanelGap, setPosition);

    const onScrollOrResize = () => {
      updatePanelPosition(triggerRef, side, triggerPanelGap, setPosition);
    };
    win.addEventListener("scroll", onScrollOrResize, true);
    win.addEventListener("resize", onScrollOrResize);
    return () => {
      win.removeEventListener("scroll", onScrollOrResize, true);
      win.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, triggerRef, side]);

  const transform = panelPortalTransform(side, position.left, position.top);

  return (
    <Box className={`${panelZ} fixed left-0 top-0`} style={{ transform }}>
      {children}
    </Box>
  );
}
