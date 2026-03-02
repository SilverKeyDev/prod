import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

import { ROUTES } from "packages/navigation";
import { useAuthStore } from "packages/store";

type RedirectIfAuthenticatedProps = PropsWithChildren<{
  /** Where to send authenticated users (default: same as LoginPage post-login fallback) */
  to?: string;
}>;

/**
 * For public routes (e.g. "/"): when user is already authenticated (e.g. auto-login),
 * redirect to the post-login destination so they see the same experience as after a normal login.
 * Reads auth state from store to avoid extra useAuthStoreIntegration instances.
 */
export function RedirectIfAuthenticated({
  children,
  to = ROUTES.DASHBOARD.replace(/\/\*$/, ""),
}: RedirectIfAuthenticatedProps) {
  const authReady = useAuthStore((s) => s.authReady);
  const authStatus = useAuthStore((s) => s.authStatus);

  if (!authReady || authStatus === "checking") {
    return null;
  }

  if (authStatus === "authenticated") {
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
}

export default RedirectIfAuthenticated;
