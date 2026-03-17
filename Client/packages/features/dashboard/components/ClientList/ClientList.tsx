import React, { useMemo, useState } from "react";

import type { ClientDealInfo, DealStage } from "packages/schemas/agent";
import { Box, Pressable, ScrollView, Text } from "packages/ui/components/primitives";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";

import ClientRow from "./ClientRow";

export type ClientListFilterUIProps = {
  filterStage: DealStage | "all";
  setFilterStage: (s: DealStage | "all") => void;
  hasRiskFlags: "all" | "has" | "none";
  setHasRiskFlags: (v: "all" | "has" | "none") => void;
};

export function ClientListFilterUI({
  filterStage,
  setFilterStage,
  hasRiskFlags,
  setHasRiskFlags,
}: ClientListFilterUIProps) {
  return (
    <Box className="bg-background-base mb-3 flex flex-col gap-2 rounded-lg p-2">
      <Text className="text-text-secondary mb-1 text-xs font-semibold">Filter by stage</Text>
      <Box className="flex flex-row flex-wrap gap-2">
        {(["all", "search", "touring", "offer", "under_contract", "closing"] as const).map(
          (stage) => {
            const isActive = filterStage === stage;
            const label =
              stage === "all"
                ? "All"
                : (stage.replace(/_/g, " ") as string).replace(/\b\w/g, (char) =>
                    char.toUpperCase()
                  );

            return (
              <Pressable
                key={stage}
                onPress={() => setFilterStage(stage)}
                className={`rounded-full px-3 py-1.5 ${
                  isActive ? "bg-primary" : "border-border bg-background-surface border"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${isActive ? "text-white" : "text-text-primary"}`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          }
        )}
      </Box>

      <Text className="text-text-secondary mb-1 mt-3 text-xs font-semibold">Risk flags</Text>
      <Box className="flex flex-row flex-wrap gap-2">
        {(["all", "has", "none"] as const).map((option) => {
          const isActive = hasRiskFlags === option;
          const labelMap: Record<typeof option | "all", string> = {
            all: "All",
            has: "With risk flags",
            none: "No risk flags",
          };
          const label = labelMap[option];

          return (
            <Pressable
              key={option}
              onPress={() => setHasRiskFlags(option)}
              className={`rounded-full px-3 py-1.5 ${
                isActive ? "bg-primary" : "border-border bg-background-surface border"
              }`}
            >
              <Text
                className={`text-xs font-medium ${isActive ? "text-white" : "text-text-primary"}`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </Box>
    </Box>
  );
}

type ClientListProps = {
  onClientClick?: (clientId: string) => void;
};

const ClientList: React.FC<ClientListProps> = ({ onClientClick }) => {
  const { clients, isLoading } = useAgentClients();
  const { enhanceClientWithDealInfo } = useAgentDashboardMockData();
  const [filterStage, setFilterStage] = useState<DealStage | "all">("all");
  const [hasRiskFlags, setHasRiskFlags] = useState<"all" | "has" | "none">("all");
  const [refreshing, setRefreshing] = useState(false);

  // Enhance clients with deal info (mock for now)
  const enhancedClients = useMemo<ClientDealInfo[]>(() => {
    if (!clients.length) return [];

    const stages: DealStage[] = ["search", "touring", "offer", "under_contract", "closing"];
    return clients.map((client, index) => {
      const stage = stages[index % stages.length];
      return enhanceClientWithDealInfo(client, stage);
    });
  }, [clients, enhanceClientWithDealInfo]);

  // Filter clients
  const filteredClients = useMemo(() => {
    return enhancedClients.filter((client) => {
      // Stage filter
      if (filterStage !== "all" && client.deal_stage !== filterStage) {
        return false;
      }

      // Risk flags filter
      if (hasRiskFlags === "has" && client.risk_flags.length === 0) {
        return false;
      }
      if (hasRiskFlags === "none" && client.risk_flags.length > 0) {
        return false;
      }

      return true;
    });
  }, [enhancedClients, filterStage, hasRiskFlags]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Add refresh logic here
    setRefreshing(false);
  };

  if (isLoading && !refreshing && !enhancedClients.length) {
    return (
      <Box className="py-12 text-center">
        <Text className="text-text-secondary text-sm">Loading clients...</Text>
      </Box>
    );
  }

  if (!enhancedClients.length) {
    return (
      <Box className="py-12 text-center">
        <Text className="text-text-secondary text-sm">
          No clients yet. New clients will appear here as you start working with them.
        </Text>
      </Box>
    );
  }

  return (
    <Box className="space-y-4">
      {/* Header */}
      <Text className="text-text-primary text-lg font-medium">Clients</Text>

      {/* Filters */}
      <ClientListFilterUI
        filterStage={filterStage}
        setFilterStage={setFilterStage}
        hasRiskFlags={hasRiskFlags}
        setHasRiskFlags={setHasRiskFlags}
      />

      {/* Client List */}
      <ScrollView refreshing={refreshing} onRefresh={handleRefresh}>
        {filteredClients.length === 0 ? (
          <Box className="items-center py-8">
            <Text className="text-text-secondary text-sm">
              {filterStage !== "all" || hasRiskFlags !== "all"
                ? "No clients match your filters."
                : "No clients yet. New clients will appear here as you start working with them."}
            </Text>
          </Box>
        ) : (
          <Box className="gap-3">
            {filteredClients.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                onClick={() => onClientClick?.(client.id)}
              />
            ))}
          </Box>
        )}
      </ScrollView>
    </Box>
  );
};

export default ClientList;
