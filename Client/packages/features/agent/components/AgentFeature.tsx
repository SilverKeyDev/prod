import { lazy, Suspense, useEffect } from "react";

import type { Dispatch, ReactNode, SetStateAction } from "react";

import { useActiveWorkspace, useIsAgent } from "packages/features/homeauth";
import { getMessagingSurfaceForWorkspace } from "packages/features/messaging/utils/workspace/getMessagingSurfaceForWorkspace";
import { useFirstRenderCommitTimer } from "packages/hooks/ui";
import { useNavigation } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { Box } from "packages/ui/components/structure/primitives";
import { stripWorkspaceShellPrefix } from "packages/utils/core/layout/dashboardLayoutConfig";
import { traceLazyImport } from "packages/utils/core/perf/shellRouteLoadTiming";

import { KeyTurnLoader } from "@/components/ui";

import {
  loadAgentDashboardModule,
  loadClientMessagingModule,
  loadWorkspaceMessagingShellModule,
} from "./loading/agentFeatureDynamicImports";

const ClientMessaging = lazy(
  traceLazyImport("MESSAGES", "lazy:ClientMessaging", loadClientMessagingModule)
);
const WorkspaceMessagingShell = lazy(
  traceLazyImport("MESSAGES", "lazy:WorkspaceMessagingShell", loadWorkspaceMessagingShellModule)
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
    const surface = getMessagingSurfaceForWorkspace(activeWorkspace);
    if (surface?.stack === "workspace") {
      return (
        <Suspense fallback={messagingBranchFallback}>
          <WorkspaceMessagingShell
            persona={surface.persona}
            setMobileHeaderActions={setMobileHeaderActions}
          />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={messagingBranchFallback}>
        <ClientMessaging
          clientPersona={surface?.stack === "agent_client" ? surface.clientPersona : "buyer"}
          setMobileHeaderActions={setMobileHeaderActions}
        />
      </Suspense>
    );
  }
  return null;
}
