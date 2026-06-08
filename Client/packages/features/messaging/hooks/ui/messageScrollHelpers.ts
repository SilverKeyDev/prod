import type { RefObject } from "react";

import { getWindow } from "packages/utils/core/platform";

export const SCROLL_BOTTOM_THRESHOLD_PX = 48;

export function getFirstMessageId(messages: unknown[]): string | undefined {
  const first = messages[0];
  if (
    first &&
    typeof first === "object" &&
    first !== null &&
    "id" in first &&
    typeof (first as { id: unknown }).id === "string"
  ) {
    return (first as { id: string }).id;
  }
  return undefined;
}

export function isOlderMessagesPrepend(
  messageCount: number,
  previousCount: number,
  firstMessageId: string | undefined,
  previousFirstMessageId: string | undefined
): boolean {
  return (
    messageCount > previousCount &&
    previousCount > 0 &&
    firstMessageId !== undefined &&
    previousFirstMessageId !== undefined &&
    firstMessageId !== previousFirstMessageId
  );
}

export function isScrolledNearBottom(
  element: HTMLElement,
  threshold = SCROLL_BOTTOM_THRESHOLD_PX
): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
}

export function setScrollTopToBottom(element: HTMLElement): void {
  element.scrollTop = element.scrollHeight;
}

export function resolveMessageScrollContainer(
  scrollContainerRef: { current: HTMLElement | null },
  messagesEndRef: RefObject<HTMLDivElement | null>
): HTMLElement | null {
  if (scrollContainerRef.current) {
    return scrollContainerRef.current;
  }
  let parent = messagesEndRef.current?.parentElement ?? null;
  while (parent) {
    const style = getWindow()?.getComputedStyle(parent);
    if (style && (style.overflowY === "auto" || style.overflowY === "scroll")) {
      scrollContainerRef.current = parent;
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

export function setScrollToBottomInstant(
  scrollContainerRef: { current: HTMLElement | null },
  messagesEndRef: RefObject<HTMLDivElement | null>
): boolean {
  const container = resolveMessageScrollContainer(scrollContainerRef, messagesEndRef);
  if (!container) {
    return false;
  }
  setScrollTopToBottom(container);
  return isScrolledNearBottom(container);
}

export function preserveScrollAfterPrepend(container: HTMLElement): void {
  const prevScrollHeight = container.scrollHeight;
  const prevScrollTop = container.scrollTop;
  requestAnimationFrame(() => {
    container.scrollTop = prevScrollTop + (container.scrollHeight - prevScrollHeight);
  });
}

export type MessageListLoadOlderConfig = {
  hasMoreOlder: boolean;
  isLoadingOlder: boolean;
  loadOlderMessages: () => Promise<void>;
};
