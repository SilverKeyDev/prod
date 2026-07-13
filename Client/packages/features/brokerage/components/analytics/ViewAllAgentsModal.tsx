/**
 * ViewAllAgentsModal — SIL-301
 * Modal listing all fixture agents with SIL-300 row actions.
 */
import { useState } from "react";

import { agentStatusColor } from "packages/features/brokerage/utils/analytics/rateColor";
import { BROKERAGE_AGENTS_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";
import { BaseModal, Button, Input } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

import { AgentRowActions } from "./AgentRowActions";
import { AnalyticsDataTable } from "./AnalyticsDataTable";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ViewAllAgentsModal({ open, onClose }: Props) {
  const [search, setSearch] = useState("");

  const filtered = [...BROKERAGE_AGENTS_FIXTURE].filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <BaseModal
      isOpen={open}
      onClose={onClose}
      title="All Agents"
      size="lg"
      footerContent={
        <BodyText size="xs" muted>
          {filtered.length} agent{filtered.length !== 1 ? "s" : ""} shown
        </BodyText>
      }
    >
      <Box className="mb-3">
        <Input
          value={search}
          onValueChange={setSearch}
          placeholder="Search agents…"
          label="Search agents"
        />
      </Box>

      <AnalyticsDataTable
        rows={filtered}
        rowKey={(agent) => agent.id}
        emptyMessage="No agents match your search."
        columns={[
          {
            key: "name",
            header: "Agent",
            cellClassName: "py-2 pr-4 font-medium",
            render: (agent) => agent.name,
          },
          {
            key: "closings",
            header: "Closings",
            headerClassName: "py-2 pr-4 text-right font-medium",
            cellClassName: "py-2 pr-4 text-right",
            render: (agent) => agent.closings,
          },
          {
            key: "status",
            header: "Status",
            render: (agent) => (
              <BodyText
                as="span"
                size="xs"
                style={{ color: agentStatusColor(agent.status), fontWeight: 500 }}
              >
                {agent.status === "top"
                  ? "Top Performer"
                  : agent.status === "at_risk"
                    ? "At Risk"
                    : "Healthy"}
              </BodyText>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (agent) => <AgentRowActions agentId={agent.id} agentName={agent.name} />,
          },
        ]}
      />

      <Box className="mt-4 flex justify-end">
        <Button type="button" variant="secondary" size="sm" onPress={onClose}>
          Close
        </Button>
      </Box>
    </BaseModal>
  );
}
