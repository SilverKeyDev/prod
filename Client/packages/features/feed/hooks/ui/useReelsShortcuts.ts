import { useCallback, useEffect, useRef } from "react";

import type { MutableRefObject } from "react";

import { useSearchViewStore } from "packages/store";
import { useFeedStore } from "packages/store";
import { getDocument, getWindow } from "packages/utils/platform";

import type { FeedScrollController } from "@/features/feed/types/feed";

import {
  handleReelsKeyDown,
  handleReelsMouseDown,
  handleReelsMouseUp,
  handleReelsWheel,
} from "./reelsShortcutsHelpers";

export type UseReelsShortcutsParams = {
  scrollControllerRef: MutableRefObject<FeedScrollController | null>;
  enabled: boolean;
};

/**
 * Desktop keyboard, wheel, and mouse-drag shortcuts for Reels:
 * - Arrow Up/Down: navigate feed
 * - Space: play/pause
 * - M: mute toggle
 * - Esc: switch to Map
 * - Mouse wheel / touchpad: one scroll per gesture (debounced)
 * - Click and drag: one scroll per drag (up or down)
 */
export function useReelsShortcuts({ scrollControllerRef, enabled }: UseReelsShortcutsParams) {
  const setMode = useSearchViewStore((s) => s.setMode);
  const setUserHasUnmuted = useFeedStore((s) => s.setUserHasUnmuted);
  const userHasUnmuted = useFeedStore((s) => s.userHasUnmuted);

  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelDirectionRef = useRef<1 | -1 | null>(null);
  const dragStartYRef = useRef<number | null>(null);

  const scrollOne = useCallback(
    (direction: 1 | -1) => {
      const ctrl = scrollControllerRef.current;
      if (!ctrl) return;
      ctrl.scrollToIndex(ctrl.currentIndex + direction);
    },
    [scrollControllerRef]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) =>
      handleReelsKeyDown(
        e,
        enabled,
        scrollControllerRef,
        setMode,
        setUserHasUnmuted,
        userHasUnmuted
      ),
    [enabled, scrollControllerRef, setMode, setUserHasUnmuted, userHasUnmuted]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) =>
      handleReelsWheel(
        e,
        enabled,
        scrollControllerRef,
        scrollOne,
        wheelTimeoutRef,
        wheelDirectionRef
      ),
    [enabled, scrollControllerRef, scrollOne]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => handleReelsMouseDown(e, enabled, dragStartYRef),
    [enabled]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => handleReelsMouseUp(e, enabled, dragStartYRef, scrollOne),
    [enabled, scrollOne]
  );

  useEffect(() => {
    if (!enabled) return;
    const win = getWindow();
    if (!win) return;
    win.addEventListener("keydown", handleKeyDown);
    return () => win.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);

  useEffect(() => {
    if (!enabled) return;
    const doc = getDocument();
    if (!doc) return;
    const container = doc.querySelector("[data-reels-feed-container]");
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    doc.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      doc.removeEventListener("mouseup", handleMouseUp);
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
        wheelTimeoutRef.current = null;
      }
    };
  }, [enabled, handleWheel, handleMouseDown, handleMouseUp]);
}
