/**
 * Web implementation of the navigation adapter.
 * Uses react-router-dom; this is the only place that should import from
 * react-router-dom when used from features and packages/hooks.
 */

import { useCallback } from "react";

import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { log } from "packages/logger";
import { pathFor } from "packages/navigation/router/paths";
import type {
  CurrentRoute,
  LinkProps,
  NavigateOptions,
  NavigationApi,
  ParamsForRoute,
  RouteName,
  SetSearchParamsInput,
  SetSearchParamsOptions,
} from "packages/navigation/types";

export function useNavigation(): NavigationApi {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const getCurrentRoute = useCallback((): CurrentRoute => {
    return {
      pathname: location.pathname,
      search: location.search,
      state: location.state,
    };
  }, [location.pathname, location.search, location.state]);

  const getSearchParams = useCallback(() => searchParams, [searchParams]);

  const setSearchParamsAdapter = useCallback(
    (input: SetSearchParamsInput, options?: SetSearchParamsOptions) => {
      setSearchParams(input, { replace: options?.replace ?? true });
    },
    [setSearchParams]
  );

  const nav = useCallback(
    <R extends RouteName>(route: R, params?: ParamsForRoute<R>, options?: NavigateOptions) => {
      const to = pathFor(route, params);
      void navigate(to, { replace: options?.replace, state: options?.state });
    },
    [navigate]
  );

  const replace = useCallback(
    <R extends RouteName>(route: R, params?: ParamsForRoute<R>, options?: NavigateOptions) => {
      const to = pathFor(route, params);
      void navigate(to, { replace: true, state: options?.state });
    },
    [navigate]
  );

  const navigateToPath = useCallback(
    (path: string, options?: NavigateOptions) => {
      log.info("ROUTING", "[NAV] useNavigation navigateToPath", {
        path,
        replace: options?.replace,
        currentPathname: location.pathname,
      });
      void navigate(path, {
        replace: options?.replace,
        state: options?.state,
      });
    },
    [navigate, location.pathname]
  );

  const goBack = useCallback(() => {
    void navigate(-1);
  }, [navigate]);

  // route/params are callback args, not closure deps; pathFor is stable (module-level)
  const linkPropsFn = useCallback(
    <R extends RouteName>(
      route: R,
      params?: ParamsForRoute<R>,
      options?: { state?: unknown }
    ): LinkProps => {
      const to = pathFor(route, params);
      return { to, state: options?.state };
    },
    []
  );

  return {
    navigate: nav,
    replace,
    navigateToPath,
    goBack,
    getCurrentRoute,
    getSearchParams,
    setSearchParams: setSearchParamsAdapter,
    linkProps: linkPropsFn,
  };
}
