import React, { useCallback, useEffect, useRef, useState } from "react";

import { Portal } from "packages/ui/components/portal";
import { getDocument, getWindow } from "packages/utils/platform";

export type PopoverSide = "left" | "bottom";

export type PopoverProps = {
  /** Trigger element (e.g. button); receives open state and toggle */
  trigger: (props: { open: boolean; onToggle: () => void }) => React.ReactNode;
  /** Panel content; receives close callback */
  children: (props: { onClose: () => void }) => React.ReactNode;
  /** Whether the popover is open (controlled) */
  open?: boolean;
  /** Called when open state changes (for controlled usage) */
  onOpenChange?: (open: boolean) => void;
  /** Render panel in a portal (default true) to avoid overflow clipping */
  usePortal?: boolean;
  /** Where the panel opens relative to the trigger: "left" = panel opens to the left (right-aligned to trigger), "bottom" = below (default) */
  side?: PopoverSide;
  /** Optional class for the panel container */
  panelClassName?: string;
  /** Optional max height for scrollable panel (e.g. "85vh") */
  panelMaxHeight?: string;
  /** Optional min width for panel (e.g. "320px") */
  panelMinWidth?: string;
  /** Optional class for the root wrapper (e.g. "w-full min-w-0") */
  className?: string;
  /** Optional class for the trigger wrapper (e.g. "w-full flex" so trigger can stretch) */
  triggerWrapperClassName?: string;
};

/**
 * Minimal popover: trigger + panel that closes on outside click and Escape.
 * Panel is positioned below the trigger using getBoundingClientRect when usePortal is true.
 */
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
}: PopoverProps): React.ReactElement {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  const onToggle = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  const onClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // Escape key (guarded for RN)
  useEffect(() => {
    if (!open) return;
    const doc = getDocument();
    if (!doc) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    doc.addEventListener("keydown", handleKeyDown);
    return () => doc.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

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

  const panelStyle: React.CSSProperties = {};
  if (panelMaxHeight) panelStyle.maxHeight = panelMaxHeight;
  if (panelMinWidth) panelStyle.minWidth = panelMinWidth;

  const panelContent = open ? (
    <div
      ref={panelRef}
      className={`z-50 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg ${panelClassName}`}
      style={panelStyle}
    >
      {children({ onClose })}
    </div>
  ) : null;

  return (
    <div className={`relative inline-block ${className}`.trim()}>
      <div ref={triggerRef} className={triggerWrapperClassName || undefined}>
        {trigger({ open, onToggle })}
      </div>
      {usePortal && open ? (
        <Portal>
          <PanelPortal triggerRef={triggerRef} open={open} side={side}>
            {panelContent}
          </PanelPortal>
        </Portal>
      ) : (
        open && <div className="absolute left-0 top-full z-50 mt-1">{panelContent}</div>
      )}
    </div>
  );
}

function updatePanelPosition(
  triggerRef: React.RefObject<HTMLDivElement | null>,
  alignLeft: boolean,
  triggerPanelGap: number,
  setPosition: (p: { top: number; left: number }) => void
) {
  if (!triggerRef.current) return;
  const rect = triggerRef.current.getBoundingClientRect();
  if (alignLeft) {
    setPosition({ left: rect.right, top: rect.bottom + triggerPanelGap });
  } else {
    setPosition({ left: rect.left, top: rect.bottom + triggerPanelGap });
  }
}

function PanelPortal({
  triggerRef,
  open,
  side,
  children,
}: {
  triggerRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  side: PopoverSide;
  children: React.ReactNode;
}): React.ReactElement {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const alignLeft = side === "left";
  const triggerPanelGap = 8;

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const win = getWindow();
    if (!win) return;
    updatePanelPosition(triggerRef, alignLeft, triggerPanelGap, setPosition);

    const onScrollOrResize = () => {
      updatePanelPosition(triggerRef, alignLeft, triggerPanelGap, setPosition);
    };
    win.addEventListener("scroll", onScrollOrResize, true);
    win.addEventListener("resize", onScrollOrResize);
    return () => {
      win.removeEventListener("scroll", onScrollOrResize, true);
      win.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, triggerRef, alignLeft]);

  const transform = alignLeft
    ? `translate(${position.left}px, ${position.top}px) translate(-100%, 0)`
    : `translate(${position.left}px, ${position.top}px)`;

  return (
    <div className="fixed left-0 top-0 z-50" style={{ transform }}>
      {children}
    </div>
  );
}
