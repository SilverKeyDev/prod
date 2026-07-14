/**
 * AgentRowActions — SIL-300
 * Two clear actions for any agent row in brokerage analytics:
 * 1. Website — opens /a/:slug public profile (only when a real slug exists)
 * 2. Analytics — navigates to per-agent analytics page
 */
import { useNavigation } from "packages/navigation";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import { getWindow } from "packages/utils/core/platform";
import { buildBrokerageAgentAnalyticsPath } from "packages/utils/growth/agent";

interface Props {
  agentId: string;
  agentName: string;
  slug?: string;
}

function openAgentWebsite(slug: string) {
  getWindow()?.open(`/a/${slug}`, "_blank", "noopener,noreferrer");
}

export function AgentRowActions({ agentId, agentName, slug }: Props) {
  const { navigateToPath } = useNavigation();

  return (
    <Box className="flex items-center gap-1">
      {slug ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onPress={() => openAgentWebsite(slug)}
          label={`Open ${agentName}'s public site`}
        >
          Website ↗
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onPress={() => navigateToPath(buildBrokerageAgentAnalyticsPath(agentId, agentName))}
        label={`View ${agentName}'s analytics`}
      >
        Analytics
      </Button>
    </Box>
  );
}
