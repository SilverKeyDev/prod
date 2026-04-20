import { useCallback, useRef } from "react";

import type { PointerEvent as ReactPointerEvent } from "react";

const DEFAULT_THRESHOLD = 56;

export type CalendarSwipeHandlers = {
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
  onPointerCancel: (e?: ReactPointerEvent) => void;
};

export type UseCalendarSwipeOptions = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  thresholdPx?: number;
  enabled?: boolean;
};

/**
 * Lightweight swipe detection for calendar navigation (web pointer events).
 */
export function useCalendarSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  thresholdPx = DEFAULT_THRESHOLD,
  enabled = true,
}: UseCalendarSwipeOptions): CalendarSwipeHandlers {
  const startRef = useRef<{ x: number; y: number; id: number } | null>(null);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (!enabled) return;
      startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    },
    [enabled]
  );

  const finish = useCallback(
    (e: ReactPointerEvent) => {
      if (!enabled || !startRef.current) return;
      if (e.pointerId !== startRef.current.id) return;
      const { x, y } = startRef.current;
      startRef.current = null;
      const dx = e.clientX - x;
      const dy = e.clientY - y;
      if (Math.abs(dx) < thresholdPx && Math.abs(dy) < thresholdPx) return;
      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      } else {
        if (dy < 0) onSwipeUp?.();
        else onSwipeDown?.();
      }
    },
    [enabled, onSwipeDown, onSwipeLeft, onSwipeRight, onSwipeUp, thresholdPx]
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent) => {
      finish(e);
    },
    [finish]
  );

  const onPointerCancel = useCallback(() => {
    startRef.current = null;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
}
