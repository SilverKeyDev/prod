/**
 * Navigation adapter types.
 * Route names and param types are defined here so features and hooks
 * use a typed API that can be implemented by web (react-router) or RN later.
 */

import { ROUTES } from "./routes";

/** Union of route names (keys of ROUTES) */
export type RouteName = keyof typeof ROUTES;

/** Params for routes that have path params (e.g. splat). Most routes have no params. */
export type RouteParamsMap = {
  PROFILE?: { splat?: string };
  LIBRARY?: { splat?: string };
  DASHBOARD?: { splat?: string };
  AGREEMENT_SIGNING_COMPLETE?: { agreementId: string };
  PROPERTY_DETAILS?: { address?: string; propertyId?: string };
};

/** Params for a given route (undefined when route has no params). */
export type ParamsForRoute<R extends RouteName> = R extends keyof RouteParamsMap
  ? RouteParamsMap[R]
  : undefined;

/** Current route info from the adapter (pathname, search, state). */
export type CurrentRoute = {
  pathname: string;
  search: string;
  state: unknown;
};

/** Options for navigate/replace (e.g. state for location). */
export type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

/** Props suitable for passing to a Link component (to + optional state). */
export type LinkProps = {
  to: string;
  state?: unknown;
};

/** Updater for search params: (prev) => next, or partial record. */
export type SetSearchParamsInput =
  | Record<string, string>
  | ((prev: URLSearchParams) => URLSearchParams);

/** Options when setting search params. */
export type SetSearchParamsOptions = { replace?: boolean };

/** Navigation API returned by useNavigation(). */
export type NavigationApi = {
  /** Navigate to a named route with optional params. */
  navigate: <R extends RouteName>(
    route: R,
    params?: ParamsForRoute<R>,
    options?: NavigateOptions
  ) => void;
  /** Replace current entry with a named route. */
  replace: <R extends RouteName>(
    route: R,
    params?: ParamsForRoute<R>,
    options?: NavigateOptions
  ) => void;
  /** Navigate to a raw path (e.g. from location.state.redirect). Use named routes when possible. */
  navigateToPath: (path: string, options?: NavigateOptions) => void;
  /** Go back one history entry. */
  goBack: () => void;
  /** Current location (pathname, search, state). */
  getCurrentRoute: () => CurrentRoute;
  /** Current URL search params (read-only snapshot). */
  getSearchParams: () => URLSearchParams;
  /** Update URL search params. */
  setSearchParams: (input: SetSearchParamsInput, options?: SetSearchParamsOptions) => void;
  /** Props for a Link to the given route (to, state). */
  linkProps: <R extends RouteName>(
    route: R,
    params?: ParamsForRoute<R>,
    options?: { state?: unknown }
  ) => LinkProps;
};
