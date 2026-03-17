import { useCallback, useState } from "react";

/**
 * Shared open/close state logic for Popover (web and native).
 * Handles controlled vs uncontrolled mode, setOpen, onToggle, onClose.
 */
export function usePopoverState(
  controlledOpen: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined
) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  const onToggle = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  const onClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return { open, setOpen, onToggle, onClose };
}
