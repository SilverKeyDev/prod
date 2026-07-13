/**
 * ViewAllAgentsModal — SIL-301
 * Modal listing all fixture agents with SIL-300 row actions.
 */
import { useState } from "react";
import { color } from "packages/design-tokens";
import { BROKERAGE_AGENTS_FIXTURE } from "packages/features/brokerage/fixtures/brokerageAnalyticsFixtures";
import { AgentRowActions } from "./AgentRowActions";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ViewAllAgentsModal({ open, onClose }: Props) {
  const [search, setSearch] = useState("");

  const successColor = color("state.success.DEFAULT");
  const dangerColor = color("state.danger.DEFAULT");
  const chartColor1 = color("chart.1");

  const filtered = [...BROKERAGE_AGENTS_FIXTURE].filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="All agents"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <Box className="relative z-10 bg-background-surface rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <Box className="flex items-center justify-between px-6 py-4 border-b border-border">
          <Title size="sm" as="h2">All Agents</Title>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </Box>

        {/* Search */}
        <Box className="px-6 py-3 border-b border-border">
          <input
            type="text"
            placeholder="Search agents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </Box>

        {/* Agent list */}
        <Box className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background-surface">
              <tr className="border-b border-border">
                <th className="py-3 px-6 text-left font-medium text-xs uppercase tracking-wide text-gray-500">Agent</th>
                <th className="py-3 px-4 text-right font-medium text-xs uppercase tracking-wide text-gray-500">Closings</th>
                <th className="py-3 px-4 font-medium text-xs uppercase tracking-wide text-gray-500">Status</th>
                <th className="py-3 px-6 font-medium text-xs uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 font-medium text-gray-900">{agent.name}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{agent.closings}</td>
                  <td className="py-3 px-4">
                    <span style={{
                      color: agent.status === "top" ? successColor : agent.status === "at_risk" ? dangerColor : chartColor1,
                      fontWeight: 500,
                      fontSize: "0.75rem",
                    }}>
                      {agent.status === "top" ? "Top Performer" : agent.status === "at_risk" ? "At Risk" : "Healthy"}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <AgentRowActions
                      agentId={agent.id}
                      agentName={agent.name}
                      slug={"slug" in agent ? (agent as typeof agent & { slug: string }).slug : undefined}
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-gray-400">No agents match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>

        {/* Footer */}
        <Box className="px-6 py-3 border-t border-border">
          <BodyText size="xs" muted>{filtered.length} agent{filtered.length !== 1 ? "s" : ""} shown</BodyText>
        </Box>
      </Box>
    </div>
  );
}