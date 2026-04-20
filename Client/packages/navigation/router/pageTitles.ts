/**
 * Route-to-page-title map for document.title updates.
 * Used by the app shell to set document.title on navigation (Meta-level UX).
 */

const ROUTE_TITLE_MAP: Array<{ pattern: string | RegExp; title: string }> = [
  { pattern: "/", title: "Home" },
  { pattern: "/signup", title: "Sign up" },
  { pattern: "/login", title: "Log in" },
  { pattern: "/forgot-password", title: "Forgot password" },
  { pattern: "/onboarding", title: "Onboarding" },
  { pattern: "/verification", title: "Verification" },
  { pattern: "/privacy", title: "Privacy" },
  { pattern: "/terms", title: "Terms" },
  { pattern: "/contact", title: "Contact" },
  { pattern: /^\/agent-profile\//, title: "Agent profile" },
  { pattern: /^\/dashboard/, title: "Dashboard" },
  { pattern: "/search", title: "Search" },
  { pattern: /^\/saved/, title: "Saved" },
  { pattern: /^\/agreements\/[^/]+\/complete/, title: "Signing complete" },
  { pattern: "/messaging", title: "Messaging" },
  { pattern: /^\/profile/, title: "Profile" },
];

export const DEFAULT_APP_TITLE = "SilverKey";

/**
 * Returns the page title segment for a pathname (e.g. "Search", "Dashboard").
 * Used to build document.title as "${pageTitle} – ${DEFAULT_APP_TITLE}".
 */
export function getPageTitle(pathname: string): string {
  const normalized = pathname.replace(/\/$/, "") || "/";
  for (const { pattern, title } of ROUTE_TITLE_MAP) {
    if (typeof pattern === "string") {
      if (normalized === pattern) return title;
    } else if (pattern.test(normalized)) {
      return title;
    }
  }
  return DEFAULT_APP_TITLE;
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
