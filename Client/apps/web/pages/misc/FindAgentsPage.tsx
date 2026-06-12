import type { Dispatch, ReactNode, SetStateAction } from "react";

import { AgentDiscoveryView } from "packages/features/agent";

type FindAgentsPageProps = {
  setMobileHeaderActions?: Dispatch<SetStateAction<ReactNode | null>>;
};

export default function FindAgentsPage(_props: FindAgentsPageProps = {}) {
  return <AgentDiscoveryView />;
}
