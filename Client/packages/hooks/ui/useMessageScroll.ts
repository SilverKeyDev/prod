import { useEffect, useRef, useCallback } from "react";

/**
 * Hook to handle auto-scrolling to bottom when messages change.
 * Works for both client and agent messaging components.
 * Always scrolls to bottom on initial load and when new messages are added.
 */
export function useMessageScroll(messages: unknown[]) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const previousMessageCountRef = useRef(0);

  const scrollToBottom = useCallback((instant = false) => {
    // Use double requestAnimationFrame to ensure DOM is fully updated before scrolling
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: instant ? "auto" : "smooth",
          block: "end",
          inline: "nearest"
        });
      });
    });
  }, []);

  useEffect(() => {
    const currentMessageCount = messages.length;
    const previousCount = previousMessageCountRef.current;
    
    // Reset initial load flag when messages are cleared (conversation switch)
    if (currentMessageCount === 0) {
      isInitialLoadRef.current = true;
      previousMessageCountRef.current = 0;
      return;
    }
    
    // On initial load (when we go from 0 to some messages), scroll instantly to bottom
    if (isInitialLoadRef.current && currentMessageCount > 0) {
      isInitialLoadRef.current = false;
      // Scroll to bottom after a brief delay to ensure DOM is fully rendered
      scrollToBottom(true);
    } 
    // When new messages are added (not initial load), scroll smoothly
    else if (currentMessageCount > previousCount && previousCount > 0) {
      scrollToBottom(false);
    }
    // If messages change but count decreased or stayed same (e.g., conversation switch with messages),
    // scroll to bottom instantly
    else if (currentMessageCount !== previousCount && previousCount > 0) {
      isInitialLoadRef.current = false; // Mark as not initial load for this conversation
      scrollToBottom(true);
    }
    
    previousMessageCountRef.current = currentMessageCount;
  }, [messages, scrollToBottom]);

  return { messagesEndRef, scrollToBottom };
}

