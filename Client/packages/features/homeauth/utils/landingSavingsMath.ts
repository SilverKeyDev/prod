export type LandingSavingsInputs = {
  agents: number;
  gci: number;
  growthPercent: number;
};

export type LandingSavingsResult = {
  growthAgents: number;
  upliftPerAgent: number;
  total: number;
};

export function computeLandingSavings({
  agents,
  gci,
  growthPercent,
}: LandingSavingsInputs): LandingSavingsResult {
  const growthAgents = Math.round((agents * growthPercent) / 100);
  const upliftPerAgent = Math.round((gci * 0.15) / 500) * 500;
  const total = growthAgents * upliftPerAgent;
  return { growthAgents, upliftPerAgent, total };
}

export function formatLandingSavingsCurrency(n: number): string {
  if (n >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1000) {
    return `$${Math.round(n / 1000)}K`;
  }
  return `$${Math.round(n)}`;
}
