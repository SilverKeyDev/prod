import { useState, useCallback } from 'react';

export interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Generic modal state management hook
 * Reusable logic without business nouns - pure UI state management
 */
export function useModal(initialState = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = "auto";
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
    document.body.style.overflow = isOpen ? "auto" : "hidden";
  }, [isOpen]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
