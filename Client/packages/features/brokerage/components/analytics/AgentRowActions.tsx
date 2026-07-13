/**
 * AgentRowActions — SIL-300
 * Two clear actions for any agent row in brokerage analytics:
 * 1. Website — opens /a/:slug public profile
 * 2. Analytics — navigates to per-agent analytics page
 */
import { useNavigation } from "packages/navigation";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import { getWindow } from "packages/utils/core/platform";

interface Props {
  agentId: string;
  agentName: string;
  slug?: string;
}

function openAgentWebsite(agentName: string, slug?: string) {
  const path = slug ? `/a/${slug}` : `/a/unclaimed?name=${encodeURIComponent(agentName)}`;
  getWindow()?.open(path, "_blank", "noopener,noreferrer");
}

export function AgentRowActions({ agentId, agentName, slug }: Props) {
  const { navigateToPath } = useNavigation();

  return (
    <Box className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onPress={() => openAgentWebsite(agentName, slug)}
        label={`Open ${agentName}'s public site`}
      >
        Website ↗
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onPress={() => navigateToPath(`/dashboard/agent/${agentId}`)}
        label={`View ${agentName}'s analytics`}
      >
        Analytics
      </Button>
    </Box>
  );
}
