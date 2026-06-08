import { useCallback, useEffect, useRef } from "react";

import type { UIEvent } from "react";

import { getWindow } from "packages/utils/core/platform";

import {
  getFirstMessageId,
  isOlderMessagesPrepend,
  type MessageListLoadOlderConfig,
  preserveScrollAfterPrepend,
  setScrollToBottomInstant,
} from "./messageScrollHelpers";

const LOAD_OLDER_SCROLL_TOP_MAX = 120;
const LOAD_OLDER_DEBOUNCE_MS = 400;

/**
 * Scrolls message lists to the latest messages on conversation open and when
 * new messages arrive. Optionally wires the web "load older" scroll handler.
 */
export function useMessageScroll(
  messages: unknown[],
  conversationId?: string,
  isLoadingHistory?: boolean,
  loadOlder?: MessageListLoadOlderConfig
) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const previousMessageCountRef = useRef(0);
  const previousConversationIdRef = useRef<string | undefined>(undefined);
  const previousFirstMessageIdRef = useRef<string | undefined>(undefined);
  const initialScrollSettledRef = useRef(false);
  const loadOlderGuardRef = useRef(false);

  const pinToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setScrollToBottomInstant(scrollContainerRef, messagesEndRef);
        initialScrollSettledRef.current = true;
      });
    });
  }, []);

  const scrollNewMessageIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        });
      });
    });
  }, []);

  useEffect(() => {
    const conversationChanged = previousConversationIdRef.current !== conversationId;
    if (conversationChanged || isLoadingHistory) {
      previousConversationIdRef.current = conversationId;
      previousMessageCountRef.current = 0;
      previousFirstMessageIdRef.current = undefined;
      initialScrollSettledRef.current = false;
      scrollContainerRef.current = null;
    }

    const currentMessageCount = messages.length;
    const previousCount = previousMessageCountRef.current;
    const currentFirstId = getFirstMessageId(messages);
    const previousFirstId = previousFirstMessageIdRef.current;

    if (
      isOlderMessagesPrepend(currentMessageCount, previousCount, currentFirstId, previousFirstId)
    ) {
      const container = scrollContainerRef.current;
      if (container) {
        preserveScrollAfterPrepend(container);
      }
      previousMessageCountRef.current = currentMessageCount;
      previousFirstMessageIdRef.current = currentFirstId;
      return;
    }

    if (
      conversationId &&
      !isLoadingHistory &&
      currentMessageCount > 0 &&
      !initialScrollSettledRef.current
    ) {
      pinToBottom();
    } else if (
      initialScrollSettledRef.current &&
      currentMessageCount > previousCount &&
      previousCount > 0
    ) {
      scrollNewMessageIntoView();
    }

    previousFirstMessageIdRef.current = currentFirstId;
    previousMessageCountRef.current = currentMessageCount;
  }, [conversationId, isLoadingHistory, messages, pinToBottom, scrollNewMessageIntoView]);

  const handleMessageListScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      if (!loadOlder) return;
      if (!initialScrollSettledRef.current) return;
      if (!loadOlder.hasMoreOlder || loadOlder.isLoadingOlder) return;
      if (e.currentTarget.scrollTop > LOAD_OLDER_SCROLL_TOP_MAX) return;
      if (loadOlderGuardRef.current) return;
      loadOlderGuardRef.current = true;
      void loadOlder.loadOlderMessages().finally(() => {
        getWindow()?.setTimeout(() => {
          loadOlderGuardRef.current = false;
        }, LOAD_OLDER_DEBOUNCE_MS);
      });
    },
    [loadOlder]
  );

  return {
    messagesEndRef,
    initialScrollSettledRef,
    handleMessageListScroll,
  };
}
