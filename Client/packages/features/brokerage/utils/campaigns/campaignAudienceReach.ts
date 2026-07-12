import { BROKERAGE_AGENTS_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";

/** Sales-band audience for campaign targeting (demo). */
export type CampaignAgentType = "all" | "low_sales" | "medium" | "strong";

export const CAMPAIGN_AGENT_TYPE_OPTIONS: {
  value: CampaignAgentType;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "low_sales", label: "Low sales" },
  { value: "medium", label: "Medium" },
  { value: "strong", label: "Strong" },
];

const STATUS_BY_TYPE: Record<Exclude<CampaignAgentType, "all">, string> = {
  low_sales: "at_risk",
  medium: "healthy",
  strong: "top",
};

/**
 * Toggle agent-type selection. Choosing "All" clears other bands;
 * choosing a band removes "All".
 */
export function toggleCampaignAgentType(
  current: readonly CampaignAgentType[],
  next: CampaignAgentType
): CampaignAgentType[] {
  if (next === "all") {
    return current.includes("all") ? [] : ["all"];
  }
  const withoutAll = current.filter((t) => t !== "all");
  if (withoutAll.includes(next)) {
    return withoutAll.filter((t) => t !== next);
  }
  return [...withoutAll, next];
}

/**
 * Count agents matching selected sales bands.
 * Empty selection or "all" → full agent roster.
 */
export function estimateCampaignReach(agentTypes: readonly CampaignAgentType[]): number {
  if (agentTypes.length === 0 || agentTypes.includes("all")) {
    return BROKERAGE_AGENTS_FIXTURE.length;
  }
  const statuses = new Set(
    agentTypes
      .filter((t): t is Exclude<CampaignAgentType, "all"> => t !== "all")
      .map((t) => STATUS_BY_TYPE[t])
  );
  return BROKERAGE_AGENTS_FIXTURE.filter((a) => statuses.has(a.status)).length;
}
