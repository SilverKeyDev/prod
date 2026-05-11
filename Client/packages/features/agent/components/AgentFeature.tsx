import { lazy, Suspense, useEffect } from "react";

import type { Dispatch, ReactNode, SetStateAction } from "react";

import { useIsAgent } from "packages/features/homeauth";
import { useFirstRenderCommitTimer } from "packages/hooks/ui";
import { LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";
import { traceLazyImport } from "packages/utils/perf/shellRouteLoadTiming";

import { KeyTurnLoader } from "@/components/ui";

import { loadAgentDashboardModule, loadClientMessagingModule } from "./agentFeatureDynamicImports";

const ClientMessaging = lazy(
  traceLazyImport(LOG_CATEGORIES.MESSAGES, "lazy:ClientMessaging", loadClientMessagingModule)
);
const AgentDashboard = lazy(
  traceLazyImport(LOG_CATEGORIES.MESSAGES, "lazy:AgentDashboard", loadAgentDashboardModule)
);

const messagingBranchFallback = (
  <Box className="flex min-h-48 flex-1 items-center justify-center p-4">
    <Box className="bg-muted/60 h-10 w-10 animate-pulse rounded-full" aria-hidden />
  </Box>
);

type AgentFeatureProps = {
  setMobileHeaderActions?: Dispatch<SetStateAction<ReactNode | null>>;
};

export default function AgentFeature({ setMobileHeaderActions }: AgentFeatureProps = {}) {
  useFirstRenderCommitTimer(LOG_CATEGORIES.MESSAGES, "AgentFeature");
  const authReady = useAuthStore((s) => s.authReady);
  const isAgent = useIsAgent();
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
        <Suspense fallback={messagingBranchFallback}>
          <AgentDashboard setMobileHeaderActions={setMobileHeaderActions} />
        </Suspense>
      </Box>
    );
  }
  if (isOnMessagingPath) {
    return (
      <Suspense fallback={messagingBranchFallback}>
        <ClientMessaging setMobileHeaderActions={setMobileHeaderActions} />
      </Suspense>
    );
  }
  return (
    <Box className="py-responsive-lg flex justify-center">
      <KeyTurnLoader message="Redirecting…" />
    </Box>
  );
}
