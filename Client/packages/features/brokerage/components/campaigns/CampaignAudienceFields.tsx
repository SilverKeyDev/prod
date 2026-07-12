import {
  CAMPAIGN_AGENT_TYPE_OPTIONS,
  type CampaignAgentType,
} from "packages/features/brokerage/utils/campaigns/campaignAudienceReach";
import { MultiSelectDropdown } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

type CampaignAudienceFieldsProps = {
  agentTypes: CampaignAgentType[];
  onAgentTypesChange: (types: CampaignAgentType[]) => void;
  estimatedReach: number;
};

export function CampaignAudienceFields({
  agentTypes,
  onAgentTypesChange,
  estimatedReach,
}: CampaignAudienceFieldsProps) {
  return (
    <Box className="flex flex-col gap-2">
      <MultiSelectDropdown<CampaignAgentType>
        label="Send to"
        options={CAMPAIGN_AGENT_TYPE_OPTIONS}
        value={agentTypes}
        onChange={(next) => {
          if (next.includes("all") && !agentTypes.includes("all")) {
            onAgentTypesChange(["all"]);
            return;
          }
          onAgentTypesChange(next.filter((t) => t !== "all"));
        }}
        placeholder="Select agent types"
        allSelectedLabel="All agents"
        size="sm"
        menuInPortal
        menuPortalStack="modal"
      />
      <BodyText size="xs" muted>
        Est. reach {estimatedReach}
      </BodyText>
    </Box>
  );
}
