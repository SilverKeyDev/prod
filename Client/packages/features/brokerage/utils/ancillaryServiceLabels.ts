/** Shared labels for Leakage + Campaigns by-service rows. */
export const ANCILLARY_SERVICE_LABELS: Record<string, string> = {
  title: "Title Insurance",
  lending: "Lending / Mortgage",
  escrow: "Escrow",
  home_warranty: "Home Warranty",
  mortgage_insurance: "Mortgage Insurance",
};

export function formatAncillaryDollars(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}
