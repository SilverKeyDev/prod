import { createContext } from "react";

export type SearchRefreshContextValue = {
  triggerRefresh: () => void;
  setTriggerRefresh: (fn: (() => void) | null) => void;
};

export const SearchRefreshContext = createContext<SearchRefreshContextValue | null>(null);
