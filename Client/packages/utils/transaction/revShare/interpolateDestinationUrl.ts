const PLACEHOLDER_RE = /\{([a-z_]+)\}/g;

const ALLOWED = new Set(["agent_id", "buyer_id", "transaction_id", "link_id", "partner_slug"]);

export type InterpolateDestinationParams = {
  linkId: string;
  agentId?: string | null;
  buyerId?: string | null;
  transactionId?: string | null;
  partnerSlug?: string | null;
};

/** Replace allowed `{placeholder}` tokens in a partner destination URL template. */
export function interpolateDestinationUrl(
  template: string,
  params: InterpolateDestinationParams
): string {
  const values: Record<string, string> = {
    link_id: params.linkId,
  };
  if (params.agentId) values.agent_id = params.agentId;
  if (params.buyerId) values.buyer_id = params.buyerId;
  if (params.transactionId) values.transaction_id = params.transactionId;
  if (params.partnerSlug) values.partner_slug = params.partnerSlug;

  return template.replace(PLACEHOLDER_RE, (match, key: string) => {
    if (!ALLOWED.has(key)) return match;
    const raw = values[key];
    if (!raw) return match;
    return encodeURIComponent(raw);
  });
}
