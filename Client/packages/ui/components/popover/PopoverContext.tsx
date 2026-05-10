import { createContext, type ReactNode, useContext, useMemo } from "react";

/**
 * Shared context exposed by `Popover` to descendants so portaled UI (e.g. `Dropdown` with
 * `menuInPortal`) can auto-register as outside-click-safe and inherit the popover's stacking
 * level. Avoids prop-drilling through deep panel content trees.
 */
export type PopoverContextValue = {
  /** Register a portaled DOM node so clicks inside it do not close the parent popover. */
  registerOutsideClickSafeTarget: (element: HTMLElement) => () => void;
  /** Stacking level of the parent popover panel. Descendants default their portaled UI to match. */
  panelStack: "page" | "modal";
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

export function PopoverContextProvider({
  registerOutsideClickSafeTarget,
  panelStack,
  children,
}: PopoverContextValue & { children: ReactNode }) {
  const value = useMemo(
    () => ({ registerOutsideClickSafeTarget, panelStack }),
    [registerOutsideClickSafeTarget, panelStack]
  );
  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
}

/** Returns the surrounding `Popover` context, or `null` when not nested inside one. */
// eslint-disable-next-line react-refresh/only-export-components -- context hook paired with Provider above
export function usePopoverContext(): PopoverContextValue | null {
  return useContext(PopoverContext);
}
