/**
 * Native implementation of the navigation adapter.
 * Uses React Navigation; must be used inside a navigator.
 */

import { useCallback } from "react";

import { useNavigation as useRNNavigation, useRoute } from "@react-navigation/native";

import { pathFor } from "./paths";
import type {
  CurrentRoute,
  LinkProps,
  NavigateOptions,
  NavigationApi,
  ParamsForRoute,
  RouteName,
  SetSearchParamsInput,
  SetSearchParamsOptions,
} from "./types";

/** Map route name to React Navigation screen name (tabs + auth). */
const ROUTE_TO_SCREEN: Record<RouteName, string> = {
  HOME: "Home",
  SIGNUP: "Signup",
  LOGIN: "Login",
  FORGOT_PASSWORD: "ForgotPassword",
  ONBOARDING: "Onboarding",
  VERIFICATION: "Verification",
  PRIVACY: "Privacy",
  TERMS: "Terms",
  CONTACT: "Contact",
  PROFILE: "Profile",
  SAVED: "Saved",
  DASHBOARD: "Dashboard",
  MESSAGING: "Messaging",
  SEARCH: "Search",
  APP: "Dashboard",
};

/** Build pathname from screen name and params (reverse of pathFor). */
function pathnameFromScreen(screenName: string, params?: Record<string, unknown>): string {
  const routeName = (Object.entries(ROUTE_TO_SCREEN).find(([, s]) => s === screenName)?.[0] ??
    "HOME") as RouteName;
  return pathFor(routeName, params as ParamsForRoute<RouteName>);
}

function unwrapRouteState(params: unknown): unknown {
  if (!params || typeof params !== "object") return params;
  const record = params as Record<string, unknown>;
  return "state" in record ? record.state : params;
}

export function useNavigation(): NavigationApi {
  const rnNav = useRNNavigation();
  const route = useRoute();

  const getCurrentRoute = useCallback((): CurrentRoute => {
    const pathname = pathnameFromScreen(route.name, route.params as Record<string, unknown>);
    return {
      pathname,
      search: "",
      state: unwrapRouteState(route.params),
    };
  }, [route.name, route.params]);

  /** RN-only: always returns empty; does not reflect URL. Use for API compatibility with web. */
  const getSearchParams = useCallback(() => new URLSearchParams(), []);

  const setSearchParamsAdapter = useCallback(
    (_input: SetSearchParamsInput, _options?: SetSearchParamsOptions) => {
      // No URL search on native; no-op or could sync to a store if needed
    },
    []
  );

  const nav = useCallback(
    <R extends RouteName>(routeName: R, params?: ParamsForRoute<R>, options?: NavigateOptions) => {
      const screenName = ROUTE_TO_SCREEN[routeName];
      rnNav.navigate(
        screenName as never,
        { ...params, ...(options?.state && { state: options.state }) } as never
      );
    },
    [rnNav]
  );

  const replace = useCallback(
    <R extends RouteName>(routeName: R, params?: ParamsForRoute<R>, options?: NavigateOptions) => {
      const screenName = ROUTE_TO_SCREEN[routeName];
      rnNav.replace(
        screenName as never,
        { ...params, ...(options?.state && { state: options.state }) } as never
      );
    },
    [rnNav]
  );

  const navigateToPath = useCallback(
    (path: string, options?: NavigateOptions) => {
      const normalized = path.replace(/^\//, "").replace(/\/$/, "") || "";
      const segments = normalized ? normalized.split("/") : [];
      const first = segments[0] ?? "";
      const screenName =
        Object.entries(ROUTE_TO_SCREEN).find(
          ([, screen]) => screen.toLowerCase() === first.toLowerCase()
        )?.[1] ?? "Home";
      const splat = segments.length > 1 ? segments.slice(1).join("/") : undefined;
      const params = {
        ...(splat && { splat: `/${splat}` }),
        ...(options?.state && { state: options.state }),
      };
      rnNav.navigate(
        screenName as never,
        (Object.keys(params).length ? params : undefined) as never
      );
    },
    [rnNav]
  );

  const goBack = useCallback(() => {
    if (rnNav.canGoBack()) rnNav.goBack();
  }, [rnNav]);

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
