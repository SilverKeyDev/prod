import { useEffect, useRef } from "react";

import { useUserData } from "packages/hooks/data/user/useUserData";
import { log } from "packages/logger";
import { ROUTES, useNavigation } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { hasPendingPublicSearch } from "packages/utils/growth/agent";

/**
 * Routes a freshly authenticated viewer to the dashboard Search when a search
 * started on a public agent page is pending (SIL-291). Login/signup land on the
 * default authenticated path, and the pending search is only consumed by the
 * Search feature (`useResumePendingPublicSearch`) — without this hop it would
 * sit unconsumed until the user happened to open Search. Mounted at the app
 * root next to `useResumePendingAgentPublicConnect`; gated on onboarding
 * completion the same way.
 */
export function useResumePendingPublicSearchNavigation(): void {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const { userProfile, userProfileLoading } = useUserData();
  const { navigate, getCurrentRoute } = useNavigation();
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (navigatedRef.current || !authReady || !isAuthenticated || !userProfile?.id) {
      return;
    }
    const onboardingComplete =
      authUser?.has_preferences === true ||
      (!userProfileLoading && userProfile.has_preferences === true);
    if (!onboardingComplete) return;
    if (!hasPendingPublicSearch()) return;

    navigatedRef.current = true;
    const { pathname } = getCurrentRoute();
    if (pathname === ROUTES.SEARCH) return;
    log.info("SEARCH", "Routing to Search to resume public agent page search", {});
    navigate("SEARCH");
  }, [
    authReady,
    isAuthenticated,
    authUser?.has_preferences,
    userProfile?.id,
    userProfile?.has_preferences,
    userProfileLoading,
    getCurrentRoute,
    navigate,
  ]);
}
