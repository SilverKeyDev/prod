import React, { useState, useMemo } from "react";
import { useAgentClients } from "../../../../../packages/hooks/data/agent/useAgentClients";
import Card from "../../../components/layout/Card";
import Dropdown from "../../../components/ui/form/Dropdown";
import type { DropdownOption } from "../../../components/ui/form/Dropdown";
import ClientRow from "./ClientRow";
import {
  enhanceClientWithDealInfo,
} from "../../../../../packages/services/agent/agentDashboard";
import type { ClientDealInfo, DealStage } from "../../../../../packages/schemas/agent";

type ClientListProps = {
  onClientClick: (clientId: string) => void;
};

const ClientList: React.FC<ClientListProps> = ({ onClientClick }) => {
  const { clients, isLoading } = useAgentClients();
  const [filterStage, setFilterStage] = useState<DealStage | "all">("all");
  const [hasRiskFlags, setHasRiskFlags] = useState<"all" | "has" | "none">("all");

  // Enhance clients with deal info (mock for now)
  const enhancedClients = useMemo<ClientDealInfo[]>(() => {
    if (!clients.length) return [];
    
    const stages: DealStage[] = ["search", "touring", "offer", "under_contract", "closing"];
    return clients.map((client, index) => {
      const stage = stages[index % stages.length];
      return enhanceClientWithDealInfo(client, stage);
    });
  }, [clients]);

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

  // Dropdown options
  const stageOptions: DropdownOption<DealStage | "all">[] = [
    { value: "all", label: "All Stages" },
    { value: "search", label: "Search" },
    { value: "touring", label: "Touring" },
    { value: "offer", label: "Offer" },
    { value: "under_contract", label: "Under Contract" },
    { value: "closing", label: "Closing" },
  ];

  const riskFlagOptions: DropdownOption<"all" | "has" | "none">[] = [
    { value: "all", label: "All Clients" },
    { value: "has", label: "With Risk Flags" },
    { value: "none", label: "No Risk Flags" },
  ];

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-responsive-base text-black/60">Loading clients...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="heading-responsive-md text-navy">Client List</h2>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Stage Filter */}
          <Dropdown
            options={stageOptions}
            value={filterStage}
            onChange={(value) => setFilterStage(value)}
            placeholder="All Stages"
            size="md"
            variant="default"
          />

          {/* Risk Flags Filter */}
          <Dropdown
            options={riskFlagOptions}
            value={hasRiskFlags}
            onChange={(value) => setHasRiskFlags(value)}
            placeholder="All Clients"
            size="md"
            variant="default"
          />
        </div>
      </Card>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-responsive-base text-black/60">
              {filterStage !== "all" || hasRiskFlags !== "all"
                ? "No clients match your filters"
                : "No clients yet"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {filteredClients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              onClick={() => onClientClick(client.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientList;
