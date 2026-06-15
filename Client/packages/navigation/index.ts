/**
 * Navigation adapter for SilverKey Client.
 * Features and shared hooks should use this API instead of react-router-dom
 * so that a second implementation for React Native can be added later.
 *
 * Allowed: useNavigation(), linkProps(), pathFor(), ROUTES, useInRouterContext
 * Not allowed in features/hooks: direct imports from react-router-dom
 */

export { useLandingHashScroll } from "./hooks/useLandingHashScroll";
export { useNavigation } from "./hooks/useNavigation";
export { useRouteParams } from "./hooks/useRouteParams";
export type { HomeHashLinkProps } from "./link/HomeHashLink";
export { HomeHashLink } from "./link/HomeHashLink";
export { Link } from "./link/Link";
export { LinkPrimitiveContext } from "./link/linkPrimitiveContext";
export { homeLandingSectionIdFromHref } from "./router/homeLandingHash";
export { NavigationOutlet } from "./router/NavigationOutlet.web";
export type { RouteSeoMeta } from "./router/pageTitles";
export {
  DEFAULT_APP_TITLE,
  DEFAULT_META_DESCRIPTION,
  getDocumentTitle,
  getPageTitle,
  getRouteSeoMeta,
} from "./router/pageTitles";
export { pathFor, ROUTES } from "./router/paths";
export { useInRouterContext } from "./router/routerContext";
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
export type { AppRouteConfig, RouteCategory } from "./types/routeConfig";
export { ROUTE_CONFIGS } from "./types/routeConfig";
export type { NavItem } from "./types/routes";
