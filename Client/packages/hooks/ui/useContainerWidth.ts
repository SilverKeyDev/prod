import { useEffect, useState } from "react";

import { getWindow } from "packages/utils/core/platform";

export interface UseContainerWidthOptions {
  /** Throttle resize updates (ms). Not used when ResizeObserver is available. */
  throttleMs?: number;
  /** Only update state when width changes by more than this (default 10). */
  minDelta?: number;
}

const DEFAULT_MIN_DELTA = 10;
const RETRY_DELAY_MS = 50;

/**
 * Returns the current width of the container element. Uses ResizeObserver when
 * available (with minDelta to avoid jitter); otherwise falls back to a throttled
 * window resize listener. Retries when ref is null (e.g. container not mounted yet).
 * Cleans up on unmount.
 */
export function useContainerWidth(
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseContainerWidthOptions = {}
): number {
  const { throttleMs = 100, minDelta = DEFAULT_MIN_DELTA } = options;
  const [width, setWidth] = useState<number>(0);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      setWidth(0);
      const id = setTimeout(() => setRetry((r) => r + 1), RETRY_DELAY_MS);
      return () => clearTimeout(id);
    }

    const update = (w: number) => {
      setWidth((prev) => (Math.abs(prev - w) > minDelta ? w : prev));
    };

    let rafId: number;
    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const w = el.clientWidth ?? 0;
        update(w);
      });
    };

    const initialWidth = el.clientWidth ?? 0;
    if (initialWidth > 0) update(initialWidth);

    const win = getWindow();
    if (win && "ResizeObserver" in win) {
      const RO = (win as Window & { ResizeObserver: typeof ResizeObserver }).ResizeObserver;
      const ro = new RO(() => onResize());
      ro.observe(el);
      return () => {
        cancelAnimationFrame(rafId);
        ro.disconnect();
      };
    }

    let lastCall = 0;
    const throttled = () => {
      const now = Date.now();
      if (now - lastCall >= throttleMs) {
        lastCall = now;
        onResize();
      }
    };
    if (win) {
      win.addEventListener("resize", throttled);
      return () => {
        cancelAnimationFrame(rafId);
        win.removeEventListener("resize", throttled);
      };
    }
    return () => cancelAnimationFrame(rafId);
  }, [containerRef, minDelta, throttleMs, retry]);

  return width;
}
