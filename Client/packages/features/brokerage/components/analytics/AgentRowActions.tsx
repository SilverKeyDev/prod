/**
 * AgentRowActions — SIL-300
 * Two clear actions for any agent row in brokerage analytics:
 * 1. Website — opens /a/:slug public profile
 * 2. Analytics — navigates to per-agent analytics page
 */
import { Box } from "packages/ui/components/structure/primitives";

interface Props {
  agentId: string;
  agentName: string;
  slug?: string;
}

export function AgentRowActions({ agentId, agentName, slug }: Props) {
  function handleWebsite() {
    if (slug) {
      window.open(`/a/${slug}`, "_blank", "noopener,noreferrer");
    } else {
      window.open(`/a/unclaimed?name=${encodeURIComponent(agentName)}`, "_blank", "noopener,noreferrer");
    }
  }

  function handleAnalytics() {
    window.location.href = `/dashboard/agent/${agentId}`;
  }

  return (
    <Box className="flex items-center gap-1">
      {slug && (
        <button
          onClick={() => window.open(`/a/${slug}`, "_blank", "noopener,noreferrer")}
          className="rounded-md px-2 py-1 text-xs font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          title={`Open ${agentName}'s public site`}
        >
          Website ↗
        </button>
      )}
      <button
        onClick={() => { window.location.href = `/dashboard/agent/${agentId}`; }}
        className="rounded-md px-2 py-1 text-xs font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        title={`View ${agentName}'s analytics`}
      >
        Analytics
      </button>
    </Box>
  );
}