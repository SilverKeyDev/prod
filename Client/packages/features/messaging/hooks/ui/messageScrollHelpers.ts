import type { RefObject } from "react";

import { getWindow } from "packages/utils/platform";

/**
 * Set scroll position to bottom, using scrollContainerRef or finding scroll parent from messagesEndRef.
 * Extracted to satisfy max-lines-per-function in useMessageScroll.
 */
export function setScrollToBottomInstant(
  scrollContainerRef: { current: HTMLElement | null },
  messagesEndRef: RefObject<HTMLDivElement | null>
): void {
  if (scrollContainerRef.current) {
    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    return;
  }
  let parent = messagesEndRef.current?.parentElement ?? null;
  while (parent) {
    const style = getWindow()?.getComputedStyle(parent);
    if (style && (style.overflowY === "auto" || style.overflowY === "scroll")) {
      parent.scrollTop = parent.scrollHeight;
      break;
    }
    parent = parent.parentElement;
  }
}
