import { useEffect } from "react";

import type { Dispatch, ReactNode, SetStateAction } from "react";

import { useNavigation } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";

import { KeyTurnLoader } from "@/components/ui";

import AgentDashboard from "./AgentDashboard";
import ClientMessaging from "./ClientMessaging";

type AgentFeatureProps = {
  setMobileHeaderActions?: Dispatch<SetStateAction<ReactNode | null>>;
};

export default function AgentFeature({ setMobileHeaderActions }: AgentFeatureProps = {}) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAgent = useAuthStore((s) => !!s.user?.is_agent);
  const { navigateToPath, getCurrentRoute } = useNavigation();
  const pathname = getCurrentRoute().pathname;
  const isOnMessagingPath = pathname === "/messaging";

  // Clear mobile header when leaving page (messaging sets its own header while mounted)
  useEffect(() => {
    return () => {
      if (setMobileHeaderActions) setMobileHeaderActions(null);
    };
  }, [setMobileHeaderActions]);

  // If a non-agent lands on a non-messaging path, redirect to /messaging (client experience).
  useEffect(() => {
    if (!authReady || isAgent) return;
    if (!isOnMessagingPath) {
      navigateToPath("/messaging", { replace: true });
    }
  }, [authReady, isAgent, isOnMessagingPath, navigateToPath]);

  // Avoid flicker: don't render a potentially incorrect experience before auth bootstrap completes
  if (!authReady) {
    return (
      <Box className="py-responsive-lg flex justify-center">
        <KeyTurnLoader message="Loading..." />
      </Box>
    );
  }

  // Agent: show agent dashboard. Client on /messaging: show client messaging. Client elsewhere: redirecting.
  if (isAgent) {
    return (
      <Box className="h-full w-full">
        <AgentDashboard setMobileHeaderActions={setMobileHeaderActions} />
      </Box>
    );
  }
  if (isOnMessagingPath) {
    return <ClientMessaging setMobileHeaderActions={setMobileHeaderActions} />;
  }
  return (
    <Box className="py-responsive-lg flex justify-center">
      <KeyTurnLoader message="Redirecting…" />
    </Box>
  );
}
