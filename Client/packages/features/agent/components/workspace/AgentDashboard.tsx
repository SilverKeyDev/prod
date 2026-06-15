import { lazy, Suspense, useLayoutEffect } from "react";

import type { ReactNode } from "react";

import { useFirstRenderCommitTimer } from "packages/hooks/ui";
import { Box } from "packages/ui/components/structure/primitives";
import { logMessagingCheckpointSinceLatestShellMark } from "packages/utils/core/perf/messagingRoutePerf";
import { traceLazyImport } from "packages/utils/core/perf/shellRouteLoadTiming";

import { loadAgentMessagingUIModule } from "./agentMessagingEntryLoad";

const AgentMessagingUI = lazy(
  traceLazyImport("MESSAGES", "lazy:AgentMessagingUI", loadAgentMessagingUIModule)
);

const agentMessagingShellFallback = (
  <Box className="flex min-h-48 flex-1 items-center justify-center p-4">
    <Box className="bg-muted/60 h-10 w-10 animate-pulse rounded-full" aria-hidden />
  </Box>
);

type AgentDashboardProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<ReactNode | null>>;
};

export default function AgentDashboard({ setMobileHeaderActions }: AgentDashboardProps = {}) {
  useFirstRenderCommitTimer("MESSAGES", "AgentDashboard");

  useLayoutEffect(() => {
    logMessagingCheckpointSinceLatestShellMark("AgentDashboard:firstLayoutCommit");
  }, []);

  return (
    <Suspense fallback={agentMessagingShellFallback}>
      <AgentMessagingUI setMobileHeaderActions={setMobileHeaderActions} />
    </Suspense>
  );
}
