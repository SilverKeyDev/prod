import { useCallback, useMemo } from "react";

import { useLocalization } from "packages/contexts";
import { ChecklistStepSubmitFooter } from "packages/features/checklists/components/ChecklistStepSubmitFooter";
import type { ChecklistIntegrationComponentProps } from "packages/features/checklists/types/componentRegistry";
import {
  isPartnerWithAgentStepComplete,
  listConnectedAgentsForPartnerStep,
} from "packages/features/checklists/utils/integration/checklistIntegrationCompleteness";
import { useAgentChats } from "packages/features/messaging/hooks/data/useAgentChats";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import { AgentDiscoveryView } from "@/features/agent/components/agentDiscovery/AgentDiscoveryView";

import PartnerAgentConnectedAgentsSection from "./PartnerAgentConnectedAgentsSection";

/**
 * Checklist step "Partner with a real estate agent": search UI plus list of connected agents.
 * Submit marks the step complete only after at least one accepted connection (messaging graph).
 */
export default function PartnerAgentSection({ onComplete }: ChecklistIntegrationComponentProps) {
  const { t } = useLocalization();
  const { conversations, refreshChats } = useAgentChats();

  const connectedAgents = useMemo(
    () => listConnectedAgentsForPartnerStep(conversations),
    [conversations]
  );

  const stepComplete = useMemo(
    () => isPartnerWithAgentStepComplete(conversations),
    [conversations]
  );

  const handleSearchSuccess = useCallback(() => {
    void refreshChats();
  }, [refreshChats]);

  const handleSubmitStep = useCallback(() => {
    if (!isPartnerWithAgentStepComplete(conversations)) {
      showWarningToast(t("checklists.partner_agent.incomplete_warning"));
      return;
    }
    onComplete?.();
  }, [conversations, onComplete, t]);

  return (
    <Card border="dotted" padding="md" className="mb-2">
      <Box className="gap-2">
        <BodyText size="sm" className="text-text-secondary">
          {t("checklists.partner_agent.intro")}
        </BodyText>
        <AgentDiscoveryView
          isActive
          className="max-w-none"
          onConnectionSuccess={handleSearchSuccess}
        />
        <PartnerAgentConnectedAgentsSection agents={connectedAgents} />
        <ChecklistStepSubmitFooter disabled={!stepComplete} onSubmit={handleSubmitStep} />
      </Box>
    </Card>
  );
}
