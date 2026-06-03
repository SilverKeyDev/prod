import { lazy, Suspense, useEffect } from "react";

import type { Dispatch, ReactNode, SetStateAction } from "react";

import { useActiveWorkspace, useIsAgent } from "packages/features/homeauth";
import { useFirstRenderCommitTimer } from "packages/hooks/ui";
import { useNavigation } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";
import { stripWorkspaceShellPrefix } from "packages/utils/layout/dashboardLayoutConfig";
import { traceLazyImport } from "packages/utils/perf/shellRouteLoadTiming";

import { KeyTurnLoader } from "@/components/ui";

import {
  loadAgentDashboardModule,
  loadClientMessagingModule,
} from "./loading/agentFeatureDynamicImports";

const ClientMessaging = lazy(
  traceLazyImport("MESSAGES", "lazy:ClientMessaging", loadClientMessagingModule)
);
const AgentDashboard = lazy(
  traceLazyImport("MESSAGES", "lazy:AgentDashboard", loadAgentDashboardModule)
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
  useFirstRenderCommitTimer("MESSAGES", "AgentFeature");
  const authReady = useAuthStore((s) => s.authReady);
  const isAgentIdentity = useIsAgent();
  const activeWorkspace = useActiveWorkspace();
  const { getCurrentRoute } = useNavigation();
  const pathname = getCurrentRoute().pathname;
  const normalizedPath = stripWorkspaceShellPrefix(pathname);
  const isOnMessagingPath =
    normalizedPath === "/messaging" || normalizedPath.startsWith("/messaging/");

  // Clear mobile header when leaving page (messaging sets its own header while mounted)
  useEffect(() => {
    return () => {
      if (setMobileHeaderActions) setMobileHeaderActions(null);
    };
  }, [setMobileHeaderActions]);

  // Avoid flicker: don't render a potentially incorrect experience before auth bootstrap completes
  if (!authReady) {
    return (
      <Box className="py-responsive-lg flex justify-center">
        <KeyTurnLoader message="Loading..." />
      </Box>
    );
  }

  const inAgentWorkspace = activeWorkspace === "agent" && isAgentIdentity;

  if (inAgentWorkspace) {
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
  return null;
}
