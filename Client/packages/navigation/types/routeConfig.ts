import { ROUTES } from "./routes";

// Route configuration types
export type AppRouteConfig = {
  path: string;
  providerType?: "maps" | "docs" | "billing";
};

export type RouteCategory = "lightweight" | "standard" | "specialized";

// Route configurations by category
export const ROUTE_CONFIGS = {
  lightweight: [ROUTES.PROFILE],

  standard: [
    ROUTES.LIBRARY,
    ROUTES.DASHBOARD,
    ROUTES.MESSAGING,
    ROUTES.ANALYTICS,
    ROUTES.AGREEMENT_SIGNING_COMPLETE,
  ],

  specialized: [{ path: ROUTES.SEARCH, providerType: "maps" as const }],
} as const;
