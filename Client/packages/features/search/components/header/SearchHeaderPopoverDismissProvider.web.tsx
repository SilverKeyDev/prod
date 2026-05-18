import { type ReactNode, useCallback, useMemo, useRef } from "react";

import {
  type CloseFn,
  SearchHeaderPopoverDismissContext,
} from "packages/features/search/hooks/ui/searchHeaderPopoverDismiss.context";

export function SearchHeaderPopoverDismissProvider({ children }: { children: ReactNode }) {
  const closersRef = useRef(new Set<CloseFn>());

  const register = useCallback((close: CloseFn) => {
    closersRef.current.add(close);
    return () => {
      closersRef.current.delete(close);
    };
  }, []);

  const dismissAll = useCallback(() => {
    closersRef.current.forEach((close) => {
      close();
    });
  }, []);

  const value = useMemo(() => ({ register, dismissAll }), [register, dismissAll]);

  return (
    <SearchHeaderPopoverDismissContext.Provider value={value}>
      {children}
    </SearchHeaderPopoverDismissContext.Provider>
  );
}
