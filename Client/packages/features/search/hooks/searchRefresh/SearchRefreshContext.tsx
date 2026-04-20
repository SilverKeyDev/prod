import { type ReactNode, useCallback, useMemo, useState } from "react";

import { SearchRefreshContext } from "./SearchRefreshContext.context";

export function SearchRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshFn, setRefreshFn] = useState<(() => void) | null>(null);

  const triggerRefresh = useCallback(() => {
    refreshFn?.();
  }, [refreshFn]);

  const setTriggerRefresh = useCallback((fn: (() => void) | null) => {
    setRefreshFn(() => fn);
  }, []);

  const contextValue = useMemo(
    () => ({ triggerRefresh, setTriggerRefresh }),
    [triggerRefresh, setTriggerRefresh]
  );

  return (
    <SearchRefreshContext.Provider value={contextValue}>{children}</SearchRefreshContext.Provider>
  );
}
