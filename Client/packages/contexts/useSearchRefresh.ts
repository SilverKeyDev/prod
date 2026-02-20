import { useContext } from "react";

import { SearchRefreshContext } from "./SearchRefreshContext.context";

export function useSearchRefresh() {
  return useContext(SearchRefreshContext);
}
