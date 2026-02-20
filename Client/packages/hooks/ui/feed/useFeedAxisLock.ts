import { useCallback, useRef } from "react";

import { useMediaQuery } from "packages/hooks/ui/responsive/useMediaQuery";
import { screenUp } from "packages/schemas/app/ui/screens";

const DEADZONE_PX_SMALL = 8;
const DEADZONE_PX_LARGE = 16;
const LARGE_SCREEN_MEDIA = screenUp("md");
const ANGLE_THRESHOLD_DEG = 45;

type AxisLock = "vertical" | "horizontal" | null;

type UseFeedAxisLockOptions = {
  /** Called when axis is decided (true = horizontal, carousel) or reset (false). */
  onLockChange?: (horizontal: boolean) => void;
};

/**
 * Angle lock heuristic for feed with horizontal carousel.
 * On first pixel of movement past deadzone, determines primary axis and locks.
 * Vertical swipe → feed scrolls (Virtuoso); horizontal swipe → in-reel carousel scrolls (Embla).
 * Use onLockChange to sync parent state (e.g. touchAction on overlay and carousel viewport).
 */
export function useFeedAxisLock(options?: UseFeedAxisLockOptions) {
  const { onLockChange } = options ?? {};
  const onLockChangeRef = useRef(onLockChange);
  onLockChangeRef.current = onLockChange;

  const isLargeScreen = useMediaQuery(LARGE_SCREEN_MEDIA);
  const deadzonePx = isLargeScreen ? DEADZONE_PX_LARGE : DEADZONE_PX_SMALL;

  const lockRef = useRef<AxisLock>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const decidedRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) {
      startRef.current = { x: t.clientX, y: t.clientY };
      decidedRef.current = false;
      lockRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(
    (
      e: React.TouchEvent,
      containerRef: React.RefObject<HTMLElement | null>,
    ) => {
      const t = e.touches[0];
      const start = startRef.current;
      if (!t || !start || !containerRef.current) return;

      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!decidedRef.current && dist >= deadzonePx) {
        decidedRef.current = true;
        const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
        const isVertical =
          angle <= ANGLE_THRESHOLD_DEG || angle >= 180 - ANGLE_THRESHOLD_DEG;
        lockRef.current = isVertical ? "vertical" : "horizontal";
        containerRef.current.style.touchAction =
          lockRef.current === "vertical" ? "pan-y" : "pan-x";
        onLockChangeRef.current?.(lockRef.current === "horizontal");
      }
    },
    [deadzonePx],
  );

  const handleTouchEnd = useCallback(
    (containerRef: React.RefObject<HTMLElement | null>) => {
      if (containerRef.current) {
        containerRef.current.style.touchAction = "";
      }
      startRef.current = null;
      decidedRef.current = false;
      lockRef.current = null;
      onLockChangeRef.current?.(false);
    },
    [],
  );

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
}
