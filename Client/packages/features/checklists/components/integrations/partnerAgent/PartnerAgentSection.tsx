import { useCallback, useMemo } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { useLocalization } from "packages/contexts";
import { listAgentRelationshipSummaries } from "packages/features/agent";
import { ChecklistStepSubmitFooter } from "packages/features/checklists/components/steps/ChecklistStepSubmitFooter";
import type { ChecklistIntegrationComponentProps } from "packages/features/checklists/types/componentRegistry";
import { isPartnerWithAgentStepComplete } from "packages/features/checklists/utils/integration/checklistIntegrationCompleteness";
import { useAgentChats } from "packages/features/messaging/hooks/data/useAgentChats";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Card from "packages/ui/components/surfaces/cards/Card";

import { AgentDiscoveryView } from "@/features/agent/components/agentDiscovery/AgentDiscoveryView";
import {
  initiatedConnectionRequestsQueryKey,
  useInitiatedConnectionRequests,
} from "@/features/agent/hooks/data/connections/useInitiatedConnectionRequests";

import PartnerAgentConnectedAgentsSection from "./PartnerAgentConnectedAgentsSection";

/**
 * Checklist step "Partner with a real estate agent": search UI plus list of connected agents.
 * Submit marks the step complete only after at least one accepted connection (messaging graph).
 */
export default function PartnerAgentSection({ onComplete }: ChecklistIntegrationComponentProps) {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const { conversations, refreshChats } = useAgentChats();
  const { requests: initiatedRequests } = useInitiatedConnectionRequests(true);

  const relationshipAgents = useMemo(
    () => listAgentRelationshipSummaries(conversations, initiatedRequests),
    [conversations, initiatedRequests]
  );

  const stepComplete = useMemo(
    () => isPartnerWithAgentStepComplete(conversations),
    [conversations]
  );

  const handleSearchSuccess = useCallback(() => {
    void refreshChats();
    void queryClient.invalidateQueries({ queryKey: initiatedConnectionRequestsQueryKey });
  }, [queryClient, refreshChats]);

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
          profileTarget="external"
          className="max-w-none"
          onConnectionSuccess={handleSearchSuccess}
        />
        <PartnerAgentConnectedAgentsSection agents={relationshipAgents} />
        <ChecklistStepSubmitFooter disabled={!stepComplete} onSubmit={handleSubmitStep} />
      </Box>
    </Card>
  );
}
