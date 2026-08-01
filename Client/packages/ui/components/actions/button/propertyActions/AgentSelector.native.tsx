/**
 * AgentSelector.native — SIL-231
 * Native sheet/modal version of AgentSelector for brokerage library.
 * Mirrors ClientSelector.native pattern.
 */
import React, { useCallback, useMemo, useState } from "react";

import Button from "@ui/button/Button";
import { Pressable, TextInput } from "react-native";

import { useLocalization } from "packages/contexts";
import { useBrokerageOrgId } from "packages/features/brokerage/hooks/useBrokerageOrgId";
import { BROKERAGE_AGENTS_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";
import { Box } from "packages/ui/components/structure/primitives";
import { Text } from "packages/ui/components/structure/primitives";
import BaseModal from "packages/ui/components/surfaces/modals/BaseModal";

import type { AgentSelectorAgent } from "./AgentSelector";

function useBrokerageAgents(): { agents: AgentSelectorAgent[]; isLoading: boolean } {
  const brokerageOrgId = useBrokerageOrgId();
  const agents: AgentSelectorAgent[] = BROKERAGE_AGENTS_FIXTURE.map((a) => ({
    id: a.id,
    name: a.name,
    office: a.office,
  }));
  return { agents, isLoading: !brokerageOrgId && false };
}

type AgentSelectorNativeProps = {
  selectedAgentId: string | null;
  onAgentChange: (agentId: string | null) => void;
  className?: string;
};

export default function AgentSelectorNative({
  selectedAgentId,
  onAgentChange,
}: AgentSelectorNativeProps) {
  const { agents, isLoading } = useBrokerageAgents();
  const { t } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      search.trim().length === 0
        ? agents
        : agents.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())),
    [agents, search]
  );

  const handleSelect = useCallback(
    (agentId: string | null) => {
      onAgentChange(agentId);
      setIsOpen(false);
      setSearch("");
    },
    [onAgentChange]
  );

  const displayLabel =
    selectedAgentId === null
      ? t("agent_selector.all_agents", { defaultValue: "All agents" })
      : (agents.find((a) => a.id === selectedAgentId)?.name ??
        t("agent_selector.select_agent", { defaultValue: "Select agent" }));

  return (
    <Box>
      <Button
        variant="outline"
        size="md"
        onPress={() => setIsOpen(true)}
        className="flex-row items-center gap-2"
      >
        <Text className="text-text-primary text-sm font-medium">{displayLabel}</Text>
        <Text className="text-text-secondary text-sm">▼</Text>
      </Button>

      <BaseModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setSearch("");
        }}
        title={t("agent_selector.select_agent", { defaultValue: "Select agent" })}
        panelLayout="fixed"
      >
        <Box className="gap-2">
          {/* Search */}
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("agent_selector.search_agents", { defaultValue: "Search agents..." })}
            className="border-border rounded-lg border px-3 py-2 text-sm"
          />

          {/* All agents row */}
          <Pressable
            onPress={() => handleSelect(null)}
            className={`rounded-lg border px-4 py-3 ${
              selectedAgentId === null
                ? "border-border bg-primary-muted"
                : "border-border bg-background-surface"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selectedAgentId === null ? "text-primary" : "text-text-primary"
              }`}
            >
              {t("agent_selector.all_agents", { defaultValue: "All agents" })}
            </Text>
          </Pressable>

          {isLoading ? (
            <Text className="text-text-secondary px-4 py-2 text-sm">
              {t("agent_selector.loading_agents", { defaultValue: "Loading agents..." })}
            </Text>
          ) : filtered.length === 0 ? (
            <Text className="text-text-secondary px-4 py-2 text-sm">
              {t("agent_selector.no_agents_found", { defaultValue: "No agents found" })}
            </Text>
          ) : (
            filtered.map((agent) => (
              <Pressable
                key={agent.id}
                onPress={() => handleSelect(agent.id)}
                className={`rounded-lg border px-4 py-3 ${
                  selectedAgentId === agent.id
                    ? "border-border bg-primary-muted"
                    : "border-border bg-background-surface"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedAgentId === agent.id ? "text-primary" : "text-text-primary"
                  }`}
                >
                  {agent.name}
                </Text>
                {agent.office ? (
                  <Text className="text-text-secondary mt-0.5 text-xs">{agent.office}</Text>
                ) : null}
              </Pressable>
            ))
          )}
        </Box>
      </BaseModal>
    </Box>
  );
}
