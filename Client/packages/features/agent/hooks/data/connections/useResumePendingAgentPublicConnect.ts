import { useEffect, useRef } from "react";

import { useLocalization } from "packages/contexts";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { ROUTES, useNavigation } from "packages/navigation";
import { useAuthStore, useUIStore } from "packages/store";
import {
  clearPendingPublicAgentConnect,
  peekPendingPublicAgentConnect,
} from "packages/utils/growth/agent";

import { connectionRequestApiErrorMessage } from "@/features/agent/utils/connectionRequestApiError";

import { useConnectionRequests } from "./useConnectionRequests";

/**
 * After login or signup/onboarding, completes a connection request when the user
 * tapped Connect on a public agent profile while logged out (intent in sessionStorage).
 */
export function useResumePendingAgentPublicConnect(): void {
  const { t } = useLocalization();
  const { getCurrentRoute, navigate } = useNavigation();
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { userProfile, userProfileLoading } = useUserData();
  const { createRequestAsInitiator } = useConnectionRequests();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!authReady || !isAuthenticated || userProfileLoading || !userProfile?.id) {
      return;
    }
    const { pathname } = getCurrentRoute();
    if (pathname === ROUTES.ONBOARDING || pathname.startsWith("/onboarding")) {
      return;
    }

    const pending = peekPendingPublicAgentConnect();
    if (!pending) return;
    if (pending === userProfile.id) {
      clearPendingPublicAgentConnect();
      return;
    }
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    void (async () => {
      try {
        const { alreadyPending } = await createRequestAsInitiator(
          userProfile.id,
          pending,
          (userProfile.roles ?? []).includes("agent"),
          undefined
        );
        clearPendingPublicAgentConnect();
        if (alreadyPending) {
          enqueueToast({
            type: "warning",
            message: t("profile.public.connect_toast_pending"),
          });
        } else {
          enqueueToast({
            type: "success",
            message: t("profile.public.connect_toast_success"),
          });
        }
        navigate("DASHBOARD", undefined, { replace: true });
      } catch (err: unknown) {
        clearPendingPublicAgentConnect();
        enqueueToast({
          type: "error",
          message: connectionRequestApiErrorMessage(err, t("profile.public.connect_resume_error")),
        });
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [
    authReady,
    isAuthenticated,
    userProfile,
    userProfileLoading,
    getCurrentRoute,
    navigate,
    createRequestAsInitiator,
    enqueueToast,
    t,
  ]);
}
