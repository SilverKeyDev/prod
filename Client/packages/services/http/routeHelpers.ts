import { getWindow } from "packages/utils/core/platform";

export { createAuthHeaders } from "packages/services/http/client";

export const routeStartsWith = (prefix: string): boolean => {
  const win = getWindow();
  return win ? win.location.pathname.startsWith(prefix) : false;
};

export const routeMatchesAny = (prefixes: string[]): boolean => {
  return prefixes.some((p) => routeStartsWith(p));
};
