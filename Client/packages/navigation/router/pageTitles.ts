/**
 * Route-to-page-title and SEO metadata for document head (web).
 */

type RouteSeoDef = {
  pattern: string | RegExp;
  title: string;
  description: string;
  /** When true, emit robots noindex for low-value or authenticated-app surfaces */
  noindex?: boolean;
};

const ROUTE_SEO_DEFS: RouteSeoDef[] = [
  {
    pattern: "/",
    title: "Home",
    description:
      "SilverKey connects home buyers with real estate tools, listings, and trusted agents in one place.",
  },
  {
    pattern: "/signup",
    title: "Sign up",
    description: "Create your SilverKey account to search homes and connect with agents.",
    noindex: true,
  },
  {
    pattern: "/login",
    title: "Log in",
    description: "Sign in to your SilverKey account.",
    noindex: true,
  },
  {
    pattern: "/forgot-password",
    title: "Forgot password",
    description: "Reset your SilverKey account password.",
    noindex: true,
  },
  {
    pattern: "/onboarding",
    title: "Onboarding",
    description: "Complete your SilverKey profile setup.",
    noindex: true,
  },
  {
    pattern: "/verification",
    title: "Verification",
    description: "Verify your SilverKey account.",
    noindex: true,
  },
  {
    pattern: "/privacy",
    title: "Privacy",
    description: "SilverKey privacy policy: how we handle your data.",
  },
  {
    pattern: "/terms",
    title: "Terms",
    description: "SilverKey terms of service.",
  },
  {
    pattern: "/contact",
    title: "Contact",
    description: "Contact SilverKey support and inquiries.",
  },
  {
    pattern: /^\/agent-profile\//,
    title: "Agent profile",
    description: "View a SilverKey agent profile, bio, and contact options.",
  },
  {
    pattern: /^\/property(\/|$)/,
    title: "Property",
    description: "Property listing details on SilverKey.",
  },
  {
    pattern: /^\/dashboard/,
    title: "Dashboard",
    description: "Your SilverKey dashboard.",
    noindex: true,
  },
  {
    pattern: "/search",
    title: "Search",
    description: "Search homes and listings on SilverKey.",
    noindex: true,
  },
  {
    pattern: /^\/saved/,
    title: "Saved",
    description: "Your saved homes on SilverKey.",
    noindex: true,
  },
  {
    pattern: /^\/agreements\/[^/]+\/complete/,
    title: "Signing complete",
    description: "Agreement signing completed.",
    noindex: true,
  },
  {
    pattern: "/messaging",
    title: "Messaging",
    description: "SilverKey messages.",
    noindex: true,
  },
  {
    pattern: "/find-agents",
    title: "Find agents",
    description: "Find and connect with real estate agents on SilverKey.",
    noindex: true,
  },
  {
    pattern: /^\/profile/,
    title: "Profile",
    description: "Your SilverKey profile settings.",
    noindex: true,
  },
  {
    pattern: /^\/admin(\/|$)/,
    title: "Admin",
    description: "SilverKey administration.",
    noindex: true,
  },
  {
    pattern: "/button-showcase",
    title: "Button showcase",
    description: "Internal SilverKey UI showcase.",
    noindex: true,
  },
];

export const DEFAULT_APP_TITLE = "SilverKey";

export const DEFAULT_META_DESCRIPTION =
  "SilverKey helps you discover homes, evaluate listings, and work with real estate agents.";

function matchRouteSeo(pathname: string): RouteSeoDef | null {
  const normalized = pathname.replace(/\/$/, "") || "/";
  for (const def of ROUTE_SEO_DEFS) {
    if (typeof def.pattern === "string") {
      if (normalized === def.pattern) return def;
    } else if (def.pattern.test(normalized)) {
      return def;
    }
  }
  return null;
}

/**
 * Returns the page title segment for a pathname (e.g. "Search", "Dashboard").
 * Used to build document.title as "${pageTitle} – ${DEFAULT_APP_TITLE}".
 */
export function getPageTitle(pathname: string): string {
  return matchRouteSeo(pathname)?.title ?? DEFAULT_APP_TITLE;
}

/**
 * Returns full document title for a pathname (e.g. "Search – SilverKey").
 * For Home, returns "Home – SilverKey"; for unknown routes, "SilverKey".
 */
export function getDocumentTitle(pathname: string): string {
  const pageTitle = getPageTitle(pathname);
  if (pageTitle === DEFAULT_APP_TITLE) return DEFAULT_APP_TITLE;
  return `${pageTitle} – ${DEFAULT_APP_TITLE}`;
}

export type RouteSeoMeta = {
  description: string;
  noindex: boolean;
};

/**
 * Description and robots hint for the current path (shell-level SEO before page overrides).
 */
export function getRouteSeoMeta(pathname: string): RouteSeoMeta {
  const m = matchRouteSeo(pathname);
  if (!m) {
    return { description: DEFAULT_META_DESCRIPTION, noindex: true };
  }
  return { description: m.description, noindex: m.noindex ?? false };
}
