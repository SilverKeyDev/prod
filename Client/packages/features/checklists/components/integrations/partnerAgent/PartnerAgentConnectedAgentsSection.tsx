import { useLocalization } from "packages/contexts";
import { ProfileAvatar } from "packages/ui/components/avatar/ProfileAvatar";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import { Title } from "@/components/ui";
import { AgentConnectionStatusBadge } from "@/features/agent/components/search/AgentConnectionStatusBadge";
import type { AgentRelationshipSummary } from "@/features/agent/utils/agentRelationshipSummaries";

export type PartnerAgentConnectedAgentsSectionProps = {
  agents: AgentRelationshipSummary[];
};

/**
 * Lists agents the buyer is already connected with (messaging), below the agent search UI.
 */
export default function PartnerAgentConnectedAgentsSection({
  agents,
}: PartnerAgentConnectedAgentsSectionProps) {
  const { t } = useLocalization();

  return (
    <Box className="border-border mt-4 border-t pt-4">
      <Title as="h3" size="md" className="text-text-primary mb-3 font-semibold">
        {t("checklists.partner_agent.connected_section_title")}
      </Title>
      {agents.length === 0 ? (
        <BodyText size="sm" className="text-text-secondary">
          {t("checklists.partner_agent.empty_state")}
        </BodyText>
      ) : (
        <Box className="flex flex-col gap-3">
          {agents.map((agent) => (
            <Box
              key={agent.agentId}
              className="border-border flex items-start gap-3 rounded-lg border p-3"
            >
              <ProfileAvatar
                imageUrl={agent.profilePictureUrl}
                label={agent.displayName}
                imageClassName="h-11 w-11 flex-shrink-0 rounded-full object-cover"
              />
              <Box className="min-w-0 flex-1">
                <Box className="mb-0.5 flex flex-wrap items-center gap-2">
                  <BodyText size="sm" className="text-text-primary font-medium">
                    {agent.displayName}
                  </BodyText>
                  <AgentConnectionStatusBadge status={agent.connectionStatus} />
                </Box>
                {agent.email ? (
                  <BodyText size="sm" className="text-text-secondary truncate">
                    {agent.email}
                  </BodyText>
                ) : null}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
