import type { ReactNode } from "react";

import { AgentShareHomesDock } from "packages/features/search/components/share/AgentShareHomesDock.web";
import type { UseAgentSearchShareSelectionReturn } from "packages/features/search/hooks/ui/useAgentSearchShareSelection";

type SearchFeatureAgentShareMountProps = {
  isAgent: boolean;
  agentShareSelection: UseAgentSearchShareSelectionReturn;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
};

export function SearchFeatureAgentShareMount({
  isAgent,
  agentShareSelection,
  selectedClientId,
  setSelectedClientId,
}: SearchFeatureAgentShareMountProps): ReactNode {
  if (!isAgent || agentShareSelection.selectedProperties.length < 1) {
    return null;
  }
  return (
    <AgentShareHomesDock
      selectedProperties={agentShareSelection.selectedProperties}
      selectedClientId={selectedClientId}
      onClientChange={setSelectedClientId}
      onRemove={agentShareSelection.removeId}
      onClear={agentShareSelection.clear}
    />
  );
}
