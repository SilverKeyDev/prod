/**
 * Navigation adapter for SilverKey Client.
 * Features and shared hooks should use this API instead of react-router-dom
 * so that a second implementation for React Native can be added later.
 *
 * Allowed: useNavigation(), linkProps(), pathFor(), ROUTES, useInRouterContext
 * Not allowed in features/hooks: direct imports from react-router-dom
 */

export { pathFor, ROUTES } from "./paths";
export { useInRouterContext } from "./routerContext";
export type {
  CurrentRoute,
  LinkProps,
  NavigateOptions,
  NavigationApi,
  ParamsForRoute,
  RouteName,
  RouteParamsMap,
  SetSearchParamsInput,
  SetSearchParamsOptions,
} from "./types";
export { useNavigation } from "./useNavigation";
export { Link } from "react-router-dom";
