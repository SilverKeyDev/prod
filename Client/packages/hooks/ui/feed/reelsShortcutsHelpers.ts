import type { MutableRefObject } from "react";

import type { FeedScrollController } from "packages/schemas/content/feed/feed";
import { getDocument, getWindow } from "packages/utils/core/platform";

const WHEEL_GESTURE_DEBOUNCE_MS = 150;
const DRAG_THRESHOLD_PX = 40;

export function handleReelsKeyDown(
  e: KeyboardEvent,
  enabled: boolean,
  scrollControllerRef: MutableRefObject<FeedScrollController | null>,
  setMode: (mode: "map" | "reels") => void,
  setUserHasUnmuted: (v: boolean) => void,
  userHasUnmuted: boolean,
) {
  if (!enabled) return;
  const ctrl = scrollControllerRef.current;
  if (!ctrl) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      ctrl.scrollToIndex(ctrl.currentIndex + 1);
      break;
    case "ArrowUp":
      e.preventDefault();
      ctrl.scrollToIndex(ctrl.currentIndex - 1);
      break;
    case " ":
      e.preventDefault();
      getWindow()?.dispatchEvent(new CustomEvent("reels-space-press"));
      break;
    case "m":
    case "M":
      e.preventDefault();
      setUserHasUnmuted(!userHasUnmuted);
      break;
    case "Escape":
      e.preventDefault();
      setMode("map");
      break;
    default:
      break;
  }
}

export function handleReelsWheel(
  e: WheelEvent,
  enabled: boolean,
  scrollControllerRef: MutableRefObject<FeedScrollController | null>,
  scrollOne: (d: 1 | -1) => void,
  wheelTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
  wheelDirectionRef: MutableRefObject<1 | -1 | null>,
) {
  if (!enabled) return;
  const ctrl = scrollControllerRef.current;
  if (!ctrl) return;

  e.preventDefault();
  const direction =
    e.deltaY > 0 ? (1 as const) : e.deltaY < 0 ? (-1 as const) : null;
  if (direction === null) return;

  wheelDirectionRef.current = direction;
  if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
  wheelTimeoutRef.current = setTimeout(() => {
    wheelTimeoutRef.current = null;
    const d = wheelDirectionRef.current;
    if (d !== null) scrollOne(d);
  }, WHEEL_GESTURE_DEBOUNCE_MS);
}

export function handleReelsMouseDown(
  e: MouseEvent,
  enabled: boolean,
  dragStartYRef: MutableRefObject<number | null>,
) {
  if (!enabled) return;
  if (e.button !== 0) return;
  dragStartYRef.current = e.clientY;
  const el = e.currentTarget as HTMLElement;
  el.style.userSelect = "none";
}

export function handleReelsMouseUp(
  e: MouseEvent,
  enabled: boolean,
  dragStartYRef: MutableRefObject<number | null>,
  scrollOne: (d: 1 | -1) => void,
) {
  if (!enabled) return;
  if (e.button !== 0) return;
  const startY = dragStartYRef.current;
  if (startY === null) return;
  dragStartYRef.current = null;

  const doc = getDocument();
  const container = doc?.querySelector(
    "[data-reels-feed-container]",
  ) as HTMLElement | null;
  if (container) container.style.userSelect = "";

  const dy = e.clientY - startY;
  if (Math.abs(dy) >= DRAG_THRESHOLD_PX) {
    scrollOne(dy > 0 ? -1 : 1);
  }
}
