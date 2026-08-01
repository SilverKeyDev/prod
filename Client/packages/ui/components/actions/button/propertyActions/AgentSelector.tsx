/**
 * AgentSelector — SIL-231
 * Dropdown to filter brokerage library by agent.
 * Mirrors ClientSelector pattern; does NOT modify ClientSelector.
 * Consumed by brokerage library header (SIL-230).
 */
import { useMemo, useState } from "react";

import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";

import { useLocalization } from "packages/contexts";
import { useBrokerageOrgId } from "packages/features/brokerage/hooks/useBrokerageOrgId";
import { BROKERAGE_AGENTS_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";
import Button from "packages/ui/components/actions/button/core/Button";
import { Box } from "packages/ui/components/structure/primitives";
import Input from "packages/ui/components/structure/primitives/input/Input";
import Popover from "packages/ui/components/surfaces/popover/Popover";
import { HEADER_ROW_CONTROL_HEIGHT } from "packages/ui/constants/layout";

export type AgentSelectorAgent = {
  id: string;
  name: string;
  office?: string;
};

type AgentSelectorProps = {
  selectedAgentId: string | null;
  onAgentChange: (agentId: string | null) => void;
  className?: string;
  menuPlacement?: "below" | "above";
};

function useBrokerageAgents(): { agents: AgentSelectorAgent[]; isLoading: boolean } {
  const brokerageOrgId = useBrokerageOrgId();
  const agents: AgentSelectorAgent[] = BROKERAGE_AGENTS_FIXTURE.map((a) => ({
    id: a.id,
    name: a.name,
    office: a.office,
  }));
  return { agents, isLoading: !brokerageOrgId && false };
}

export default function AgentSelector({
  selectedAgentId,
  onAgentChange,
  className = "",
  menuPlacement = "below",
}: AgentSelectorProps) {
  const { agents, isLoading } = useBrokerageAgents();
  const { t } = useLocalization();
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      search.trim().length === 0
        ? agents
        : agents.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())),
    [agents, search]
  );

  const triggerLabel =
    selectedAgentId === null
      ? t("agent_selector.all_agents", { defaultValue: "All agents" })
      : (agents.find((a) => a.id === selectedAgentId)?.name ??
        t("agent_selector.select_agent", { defaultValue: "Select agent" }));

  return (
    <Popover
      usePortal
      side={menuPlacement === "above" ? "top" : "bottom"}
      className={className}
      triggerWrapperClassName="w-full"
      panelClassName="w-64 min-w-60 py-1"
      panelMaxHeight="min(60vh, 420px)"
      label={t("agent_selector.select_agent", { defaultValue: "Select agent" })}
      trigger={({ open, onToggle }) => (
        <Button
          type="button"
          variant="outline"
          contentAlign="start"
          label={triggerLabel}
          onClick={onToggle}
          aria-haspopup="true"
          aria-expanded={open}
          className={`focus:border-input-variant-focus-border border-border bg-background-surface text-text-primary flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 ${HEADER_ROW_CONTROL_HEIGHT}`}
          icon={<Icon name="users" className="h-4 w-4 shrink-0" />}
        >
          <>
            <BodyText as="span">{triggerLabel}</BodyText>
            <Icon
              name="chevron-down"
              className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </>
        </Button>
      )}
    >
      {({ onClose }) => {
        const handleSelect = (agentId: string | null) => {
          onAgentChange(agentId);
          onClose();
        };
        return (
          <Box className="flex flex-col gap-1 px-1">
            {/* Search input */}
            <Box className="px-2 py-1">
              <Input
                type="text"
                value={search}
                onValueChange={setSearch}
                label={t("agent_selector.search_agents", {
                  defaultValue: "Search agents...",
                })}
                placeholder={t("agent_selector.search_agents", {
                  defaultValue: "Search agents...",
                })}
                className="border-border w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </Box>

            {/* All agents row */}
            <Button
              type="button"
              variant="ghost"
              contentAlign="start"
              rounded="md"
              onClick={() => handleSelect(null)}
              className={`w-full px-3 py-3 text-left text-sm hover:bg-neutral-100 ${
                selectedAgentId === null
                  ? "bg-primary-muted text-primary font-medium"
                  : "text-text-primary"
              }`}
              icon={<Icon name="users" className="h-4 w-4 shrink-0" />}
            >
              <BodyText as="span" className="text-left">
                {t("agent_selector.all_agents", { defaultValue: "All agents" })}
              </BodyText>
            </Button>

            {filtered.length > 0 && <Box className="border-border mx-1 my-1 border-t" />}

            {isLoading ? (
              <Box className="text-text-secondary px-3 py-3 text-left text-sm">
                {t("agent_selector.loading_agents", { defaultValue: "Loading agents..." })}
              </Box>
            ) : filtered.length === 0 ? (
              <Box className="px-3 py-3 text-left text-sm text-gray-400">
                {t("agent_selector.no_agents_found", { defaultValue: "No agents found" })}
              </Box>
            ) : (
              filtered.map((agent) => (
                <Button
                  key={agent.id}
                  type="button"
                  variant="ghost"
                  contentAlign="start"
                  rounded="md"
                  onClick={() => handleSelect(agent.id)}
                  className={`w-full px-3 py-3 text-left text-sm hover:bg-neutral-100 ${
                    selectedAgentId === agent.id
                      ? "bg-primary-muted text-primary font-medium"
                      : "text-text-primary"
                  }`}
                  icon={<Icon name="user" className="h-4 w-4 shrink-0" />}
                >
                  <Box className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
                    <BodyText as="span" className="w-full truncate text-left">
                      {agent.name}
                    </BodyText>
                    {agent.office && (
                      <BodyText as="span" size="xs" muted className="w-full truncate text-left">
                        {agent.office}
                      </BodyText>
                    )}
                  </Box>
                </Button>
              ))
            )}
          </Box>
        );
      }}
    </Popover>
  );
}
