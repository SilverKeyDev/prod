import { stripWorkspaceShellPrefix } from "packages/utils/layout/dashboardLayoutConfig";

/** Normalize href or pathname to a workspace-stripped path (no query/hash). */
export function normalizeShellRoutePath(pathnameOrHref: string): string {
  const raw = (pathnameOrHref.split("?")[0] ?? "").split("#")[0] ?? "";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return stripWorkspaceShellPrefix(withSlash);
}

/** True when the user is already on the route being prefetched (avoids redundant hover work). */
export function isAlreadyOnShellRoute(currentPathname: string, targetHref: string): boolean {
  const current = normalizeShellRoutePath(currentPathname);
  const target = normalizeShellRoutePath(targetHref);
  if (current === target) {
    return true;
  }
  if (target === "/") {
    return false;
  }
  return current.startsWith(`${target}/`);
}
