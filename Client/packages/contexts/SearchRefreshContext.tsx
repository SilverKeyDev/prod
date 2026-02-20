import { type ReactNode, useCallback, useState } from "react";

import { SearchRefreshContext } from "./SearchRefreshContext.context";

export function SearchRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshFn, setRefreshFn] = useState<(() => void) | null>(null);

  const triggerRefresh = useCallback(() => {
    refreshFn?.();
  }, [refreshFn]);

  const setTriggerRefresh = useCallback((fn: (() => void) | null) => {
    setRefreshFn(() => fn);
  }, []);

  return (
    <SearchRefreshContext.Provider
      value={{ triggerRefresh, setTriggerRefresh }}
    >
      {children}
    </SearchRefreshContext.Provider>
  );
}
