import { useLocalization } from "packages/contexts";
import type { ConnectedAgentSummary } from "packages/features/checklists/utils/integration/checklistIntegrationCompleteness";
import { ProfileAvatar } from "packages/ui/components/avatar/ProfileAvatar";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import { Title } from "@/components/ui";

export type PartnerAgentConnectedAgentsSectionProps = {
  agents: ConnectedAgentSummary[];
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
        <Box className="gap-2">
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
                <BodyText size="sm" className="text-text-primary font-medium">
                  {agent.displayName}
                </BodyText>
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
