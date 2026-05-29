import { useEffect } from "react";

import { useSearchHeaderPopoverDismiss } from "./useSearchHeaderPopoverDismiss";

/** Register a popover close handler while open (e.g. map click dismisses search header popovers). */
export function useRegisterSearchHeaderPopoverWhenOpen(open: boolean, onClose: () => void): void {
  const dismissCtx = useSearchHeaderPopoverDismiss();

  useEffect(() => {
    if (!dismissCtx || !open) return;
    return dismissCtx.register(onClose);
  }, [dismissCtx, open, onClose]);
}
