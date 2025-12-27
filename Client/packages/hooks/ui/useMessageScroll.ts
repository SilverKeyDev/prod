import { useEffect, useRef, useCallback } from "react";

/**
 * Hook to handle auto-scrolling to bottom when messages change.
 * Works for both client and agent messaging components.
 */
export function useMessageScroll(messages: unknown[]) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return { messagesEndRef, scrollToBottom };
}

