import type { AgentSearchResult } from "@/features/agent/api/agent";

export type AgentDiscoveryProfileTarget = "navigate" | "external";

export type AgentDiscoveryViewProps = {
  isActive?: boolean;
  /**
   * `external`: open public profile in a new tab / system browser (checklist partner step).
   * `navigate`: in-app profile route.
   */
  profileTarget?: AgentDiscoveryProfileTarget;
  /** When set, overrides default profile open behavior for the given `profileTarget`. */
  onOpenAgentProfile?: (agent: Pick<AgentSearchResult, "id" | "name">) => void;
  /** Called after a connection request is sent from the search section. */
  onConnectionSuccess?: () => void;
  className?: string;
};
