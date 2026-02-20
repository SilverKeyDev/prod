import { useCallback, useEffect, useRef } from "react";

const DOUBLE_TAP_MS = 300;

type UseFeedGestureTrapOptions = {
  onSingleTap?: () => void;
  onDoubleTap: () => void;
};

/**
 * Detects single-tap vs double-tap: single tap triggers onSingleTap (e.g. mute/unmute),
 * double-tap within 300ms triggers onDoubleTap (e.g. like).
 */
export function useFeedGestureTrap(
  options: UseFeedGestureTrapOptions | (() => void),
) {
  const onDoubleTap =
    typeof options === "function" ? options : options.onDoubleTap;
  const onSingleTap =
    typeof options === "function" ? undefined : options.onSingleTap;

  const lastTapRef = useRef<number>(0);
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleTap = useCallback(() => {
    const now = Date.now();

    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }

    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      onDoubleTap();
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;

    if (onSingleTap) {
      singleTapTimeoutRef.current = setTimeout(() => {
        singleTapTimeoutRef.current = null;
        onSingleTap();
      }, DOUBLE_TAP_MS);
    }
  }, [onDoubleTap, onSingleTap]);

  useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
    };
  }, []);

  return { onTap: handleTap };
}
