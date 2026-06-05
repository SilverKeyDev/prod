import { useCallback, useEffect, useRef } from "react";

import { getWindow } from "packages/utils/core/platform";

import { setScrollToBottomInstant } from "./messageScrollHelpers";

function getFirstMessageId(messages: unknown[]): string | undefined {
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

/**
 * Hook to handle auto-scrolling to bottom when messages change.
 * Works for both client and agent messaging components.
 * Always scrolls to bottom on initial load and when new messages are added.
 */
export function useMessageScroll(
  messages: unknown[],
  conversationId?: string,
  isLoadingHistory?: boolean
) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const isInitialLoadRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const previousConversationIdRef = useRef<string | undefined>(undefined);
  const previousLoadingStateRef = useRef<boolean | undefined>(undefined);
  const previousFirstMessageIdRef = useRef<string | undefined>(undefined);

  // Find the scrollable container parent
  useEffect(() => {
    if (messagesEndRef.current) {
      // Find the nearest parent with overflow-y-auto
      let parent = messagesEndRef.current.parentElement;
      while (parent) {
        const style = getWindow()?.getComputedStyle(parent);
        if (style && (style.overflowY === "auto" || style.overflowY === "scroll")) {
          scrollContainerRef.current = parent;
          break;
        }
        parent = parent.parentElement;
      }
    }
  }, [messages.length]);

  const scrollToBottom = useCallback((instant = false) => {
    if (instant && scrollContainerRef.current) {
      // For instant scroll on initial load, set scrollTop directly to avoid any animation
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    } else {
      // For smooth scroll when new messages arrive, use scrollIntoView
      const scroll = () => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        });
      };
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scroll();
        });
      });
    }
  }, []);

  useEffect(() => {
    const currentMessageCount = messages.length;
    const previousCount = previousMessageCountRef.current;
    const conversationChanged = previousConversationIdRef.current !== conversationId;
    const currentFirstId = getFirstMessageId(messages);
    const previousFirstId = previousFirstMessageIdRef.current;

    const isPrepend =
      !conversationChanged &&
      currentMessageCount > previousCount &&
      previousCount > 0 &&
      currentFirstId !== undefined &&
      previousFirstId !== undefined &&
      currentFirstId !== previousFirstId;

    if (isPrepend && scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      const prevScrollHeight = el.scrollHeight;
      const prevScrollTop = el.scrollTop;
      requestAnimationFrame(() => {
        const next = scrollContainerRef.current;
        if (!next) return;
        const delta = next.scrollHeight - prevScrollHeight;
        next.scrollTop = prevScrollTop + delta;
      });
      previousMessageCountRef.current = currentMessageCount;
      previousFirstMessageIdRef.current = currentFirstId;
      return;
    }

    previousFirstMessageIdRef.current = currentFirstId;

    // Reset initial load flag when conversation changes or messages are cleared
    if (conversationChanged || currentMessageCount === 0) {
      isInitialLoadRef.current = true;
      previousMessageCountRef.current = 0;
      previousConversationIdRef.current = conversationId;
      if (currentMessageCount === 0) {
        return;
      }
    }

    if (isInitialLoadRef.current && currentMessageCount > 0) {
      isInitialLoadRef.current = false;
      requestAnimationFrame(() => {
        setScrollToBottomInstant(scrollContainerRef, messagesEndRef);
      });
    } else if (currentMessageCount > previousCount && previousCount > 0) {
      scrollToBottom(false);
    } else if (currentMessageCount !== previousCount && previousCount > 0) {
      isInitialLoadRef.current = false;
      requestAnimationFrame(() => {
        setScrollToBottomInstant(scrollContainerRef, messagesEndRef);
      });
    } else if (currentMessageCount > 0 && previousCount === 0 && !isInitialLoadRef.current) {
      requestAnimationFrame(() => {
        setScrollToBottomInstant(scrollContainerRef, messagesEndRef);
      });
    }

    previousMessageCountRef.current = currentMessageCount;
  }, [messages, scrollToBottom, conversationId]);

  useEffect(() => {
    const wasLoading = previousLoadingStateRef.current === true;
    const isNowLoaded = isLoadingHistory === false;

    if (wasLoading && isNowLoaded && messages.length > 0) {
      requestAnimationFrame(() => {
        setScrollToBottomInstant(scrollContainerRef, messagesEndRef);
      });
    }

    previousLoadingStateRef.current = isLoadingHistory;
  }, [isLoadingHistory, messages.length]);

  return { messagesEndRef, scrollToBottom };
}
