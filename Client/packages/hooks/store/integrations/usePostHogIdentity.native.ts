import { useEffect } from "react";

import {
  identifyPostHogUser,
  initPostHogClient,
  resetPostHogUser,
} from "packages/services/analytics/posthogClient";
import { useAuthStore } from "packages/store";

export function usePostHogIdentity(): void {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    initPostHogClient();
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (isAuthenticated && user?.id) {
      identifyPostHogUser(String(user.id), {
        has_agent_role: (user.roles ?? []).includes("agent"),
        has_brokerage: Boolean(user.brokerage),
      });
      return;
    }

    resetPostHogUser();
  }, [authReady, isAuthenticated, user?.id, user?.roles, user?.brokerage]);
}
