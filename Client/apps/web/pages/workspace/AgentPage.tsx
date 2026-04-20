import type { Dispatch, ReactNode, SetStateAction } from "react";

import { AgentFeature } from "packages/features/agent";

type AgentPageProps = {
  setMobileHeaderActions?: Dispatch<SetStateAction<ReactNode | null>>;
};

export default function AgentPage({ setMobileHeaderActions }: AgentPageProps = {}) {
  return <AgentFeature setMobileHeaderActions={setMobileHeaderActions} />;
}
