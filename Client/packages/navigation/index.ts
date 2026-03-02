/**
 * Navigation adapter for SilverKey Client.
 * Features and shared hooks should use this API instead of react-router-dom
 * so that a second implementation for React Native can be added later.
 *
 * Allowed: useNavigation(), linkProps(), pathFor(), ROUTES, useInRouterContext
 * Not allowed in features/hooks: direct imports from react-router-dom
 */

export { Link } from "./Link";
export { LinkPrimitiveContext } from "./linkPrimitiveContext";
export { getDocumentTitle, getPageTitle } from "./pageTitles";
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
export type { AppRouteConfig, RouteCategory } from "./types/routeConfig";
export { ROUTE_CONFIGS } from "./types/routeConfig";
export type { NavItem } from "./types/routes";
export { useNavigation } from "./useNavigation";
