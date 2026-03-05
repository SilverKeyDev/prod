import { createContext, useContext } from "react";

import type { Location } from "react-router-dom";

/**
 * When set, layout/route code should use this instead of useLocation()
 * (workaround for remix-run/react-router#11473 – router context lags behind browser URL).
 */
export const LocationOverrideContext = createContext<Location | null>(null);

export function useLocationOverride(): Location | null {
  return useContext(LocationOverrideContext);
}
