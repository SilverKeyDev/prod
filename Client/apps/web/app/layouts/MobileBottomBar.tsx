import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type MobileBottomBarProps = {
  children: ReactNode | null;
  /**
   * Height of the fixed bottom nav (MobileSidebar). We sit directly above it.
   * Defaults to 64px (h-16).
   */
  bottomOffsetPx?: number;
  /**
   * Optional callback with the measured bar height in px.
   * Used by the layout to render a spacer so content isn't hidden behind the bar.
   */
  onHeightChange?: (heightPx: number) => void;
};

export default function MobileBottomBar({
  children,
  bottomOffsetPx = 64,
  onHeightChange,
}: MobileBottomBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!onHeightChange) return;
    onHeightChange(children ? height : 0);
    // Intentionally omit `children` - only height matters. Including children causes
    // "Maximum update depth exceeded" because new element refs trigger parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, onHeightChange]);

  useEffect(() => {
    if (!children) {
      setHeight(0);
      return;
    }
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [children]);

  if (!mounted || !children) return null;

  const bar = (
    <div
      ref={containerRef}
      className="fixed inset-x-0 z-[9998] w-screen md:hidden"
      style={{ bottom: `${bottomOffsetPx}px` }}
      role="region"
      aria-label="Mobile bottom bar"
    >
      <div className="safe-bottom-fallback w-full">{children}</div>
    </div>
  );

  // Portal to <body> to avoid stacking/scroll containers interfering with fixed positioning.
  return createPortal(bar, document.body);
}
