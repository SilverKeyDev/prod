import { useCallback } from "react";

import type { ChecklistIntegrationComponentProps } from "packages/features/checklists/types/componentRegistry";
import { Box } from "packages/ui/components/primitives";

import { AgentSearchPanel } from "@/features/agent/components/search/AgentSearchPanel";

/**
 * Checklist step "Partner with a real estate agent": same shell as messaging `AgentSearchModal`
 * (modal and this step both use `AgentSearchPanel`). Completing the step uses the inline send
 * action in the search UI (no separate checklist Submit control).
 */
export default function PartnerAgentSection({ onComplete }: ChecklistIntegrationComponentProps) {
  const handleSuccess = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  return (
    <Box className="gap-0">
      <AgentSearchPanel isActive onSuccess={handleSuccess} />
    </Box>
  );
}
