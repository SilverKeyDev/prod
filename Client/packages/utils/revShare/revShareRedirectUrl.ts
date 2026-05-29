export type RevShareRedirectParams = {
  linkId: string;
  buyerId?: string | null;
  transactionId?: string | null;
  stepId?: string | null;
  sessionId?: string | null;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

/** Build same-origin tracked redirect URL (`/r/{linkId}`). */
export function buildRevShareRedirectUrl(origin: string, params: RevShareRedirectParams): string {
  const base = origin.replace(/\/$/, "");
  const url = new URL(`${base}/r/${encodeURIComponent(params.linkId)}`);
  if (params.buyerId) url.searchParams.set("buyer_id", params.buyerId);
  if (params.transactionId) url.searchParams.set("transaction_id", params.transactionId);
  if (params.stepId) url.searchParams.set("step_id", params.stepId);
  if (params.sessionId) url.searchParams.set("session_id", params.sessionId);
  if (params.utmSource) url.searchParams.set("utm_source", params.utmSource);
  if (params.utmMedium) url.searchParams.set("utm_medium", params.utmMedium);
  if (params.utmCampaign) url.searchParams.set("utm_campaign", params.utmCampaign);
  return url.toString();
}

export function formatCtrPercent(ctr: number | null | undefined): string {
  if (ctr == null || Number.isNaN(ctr)) return "—";
  return `${(ctr * 100).toFixed(1)}%`;
}

export function formatEstimatedRevenue(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
