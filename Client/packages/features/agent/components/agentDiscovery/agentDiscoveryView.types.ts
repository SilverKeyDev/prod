import type { AgentSearchResult } from "@/features/agent/api/agent";

export type AgentDiscoveryViewProps = {
  isActive?: boolean;
  /** When set, overrides default web navigation to public profile URL. */
  onOpenAgentProfile?: (agent: Pick<AgentSearchResult, "id" | "name">) => void;
  /** Called after a connection request is sent from the search section. */
  onConnectionSuccess?: () => void;
  className?: string;
};
