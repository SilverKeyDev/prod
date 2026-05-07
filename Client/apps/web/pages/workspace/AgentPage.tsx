import { type Dispatch, type ReactNode, type SetStateAction, useEffect } from "react";

import { AgentFeature } from "packages/features/agent";
import { useNavigation } from "packages/navigation";
import { shellRoutePageMounted } from "packages/utils/perf/shellRouteLoadTiming";

type AgentPageProps = {
  setMobileHeaderActions?: Dispatch<SetStateAction<ReactNode | null>>;
};

export default function AgentPage({ setMobileHeaderActions }: AgentPageProps = {}) {
  const { getCurrentRoute } = useNavigation();
  const pathname = getCurrentRoute().pathname;

  useEffect(() => {
    shellRoutePageMounted("messaging", pathname);
  }, [pathname]);

  return <AgentFeature setMobileHeaderActions={setMobileHeaderActions} />;
}
