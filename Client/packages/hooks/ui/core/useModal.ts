import { useCallback, useState } from "react";

import { getDocument } from "packages/utils/core/platform";

export type UseModalReturn = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

/**
 * Generic modal state management hook
 * Reusable logic without business nouns - pure UI state management
 */
export function useModal(initialState = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
    const doc = getDocument();
    if (doc?.body) doc.body.style.overflow = "hidden";
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    const doc = getDocument();
    if (doc?.body) doc.body.style.overflow = "auto";
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    const doc = getDocument();
    if (doc?.body) doc.body.style.overflow = isOpen ? "auto" : "hidden";
  }, [isOpen]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
