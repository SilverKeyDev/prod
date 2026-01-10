import { useEffect, useRef, useCallback } from "react";

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

  // Find the scrollable container parent
  useEffect(() => {
    if (messagesEndRef.current) {
      // Find the nearest parent with overflow-y-auto
      let parent = messagesEndRef.current.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
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
          inline: "nearest"
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
    
    // Reset initial load flag when conversation changes or messages are cleared
    if (conversationChanged || currentMessageCount === 0) {
      isInitialLoadRef.current = true;
      previousMessageCountRef.current = 0;
      previousConversationIdRef.current = conversationId;
      if (currentMessageCount === 0) {
        return;
      }
    }
    
    // On initial load (when we go from 0 to some messages), set scroll position instantly
    if (isInitialLoadRef.current && currentMessageCount > 0) {
      isInitialLoadRef.current = false;
      // Use requestAnimationFrame to ensure DOM is rendered, then set scrollTop directly
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        } else if (messagesEndRef.current) {
          // Fallback: find scroll container and set scrollTop directly for instant scroll
          let parent = messagesEndRef.current.parentElement;
          while (parent) {
            const style = window.getComputedStyle(parent);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
              parent.scrollTop = parent.scrollHeight;
              break;
            }
            parent = parent.parentElement;
          }
        }
      });
    } 
    // When new messages are added (not initial load), scroll smoothly
    else if (currentMessageCount > previousCount && previousCount > 0) {
      scrollToBottom(false);
    }
    // If messages change but count decreased or stayed same (e.g., conversation switch with messages),
    // set scroll position instantly - this handles when switching conversations
    else if (currentMessageCount !== previousCount && previousCount > 0) {
      isInitialLoadRef.current = false; // Mark as not initial load for this conversation
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        } else if (messagesEndRef.current) {
          // Fallback: find scroll container and set scrollTop directly for instant scroll
          let parent = messagesEndRef.current.parentElement;
          while (parent) {
            const style = window.getComputedStyle(parent);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
              parent.scrollTop = parent.scrollHeight;
              break;
            }
            parent = parent.parentElement;
          }
        }
      });
    }
    // If messages change but we haven't tracked previous count yet (edge case), set scroll position
    else if (currentMessageCount > 0 && previousCount === 0 && !isInitialLoadRef.current) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        } else if (messagesEndRef.current) {
          // Fallback: find scroll container and set scrollTop directly for instant scroll
          let parent = messagesEndRef.current.parentElement;
          while (parent) {
            const style = window.getComputedStyle(parent);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
              parent.scrollTop = parent.scrollHeight;
              break;
            }
            parent = parent.parentElement;
          }
        }
      });
    }
    
    previousMessageCountRef.current = currentMessageCount;
  }, [messages, scrollToBottom, conversationId]);

  // Handle scroll when loading finishes (isLoadingHistory changes from true to false)
  useEffect(() => {
    const wasLoading = previousLoadingStateRef.current === true;
    const isNowLoaded = isLoadingHistory === false;
    
    // When loading finishes and we have messages, scroll to bottom instantly
    if (wasLoading && isNowLoaded && messages.length > 0) {
      // Use requestAnimationFrame to ensure DOM is rendered, then scroll instantly
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        } else if (messagesEndRef.current) {
          // Fallback: find scroll container and set scrollTop directly for instant scroll
          let parent = messagesEndRef.current.parentElement;
          while (parent) {
            const style = window.getComputedStyle(parent);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
              parent.scrollTop = parent.scrollHeight;
              break;
            }
            parent = parent.parentElement;
          }
        }
      });
    }
    
    previousLoadingStateRef.current = isLoadingHistory;
  }, [isLoadingHistory, messages.length]);

  return { messagesEndRef, scrollToBottom };
}

