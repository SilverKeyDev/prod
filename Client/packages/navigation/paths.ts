/**
 * Path building for the navigation adapter.
 * Uses route constants from schemas; does not depend on react-router.
 */

import { ROUTES } from "packages/schemas/app/nav";

import type { ParamsForRoute, RouteName, RouteParamsMap } from "./types";

export { ROUTES };

/**
 * Build path string for a route and optional params.
 * Handles splat routes (PROFILE, SAVED, DASHBOARD) by appending splat to the base path.
 */
export function pathFor<R extends RouteName>(
  route: R,
  params?: ParamsForRoute<R>,
): string {
  const path = ROUTES[route];
  const base = path.replace(/\/\*$/, "") || path;
  if (!params || typeof params !== "object" || !("splat" in params)) {
    return base || "/";
  }
  const splat =
    (params as RouteParamsMap[R & keyof RouteParamsMap])?.splat?.replace(
      /^\//,
      "",
    ) ?? "";
  const result = splat ? `${base}/${splat}` : base;
  return result || "/";
}
