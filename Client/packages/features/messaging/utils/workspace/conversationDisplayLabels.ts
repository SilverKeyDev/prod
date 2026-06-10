import type { WorkspaceConversation } from "packages/features/messaging/api/workspaceConversations";

export function workspaceConversationTitle(
  conv: Pick<
    WorkspaceConversation,
    "kind" | "support_category" | "agent_user_id" | "brokerage_org_id" | "partner_id"
  >,
  sectionTitle: string,
  contactNameById?: ReadonlyMap<string, string>
): string {
  if (conv.kind === "platform_support") {
    return conv.support_category === "integrator" ? "Integrator support" : "Brokerage support";
  }
  if (conv.kind === "brokerage_agent" && conv.agent_user_id) {
    return contactNameById?.get(conv.agent_user_id) ?? sectionTitle;
  }
  if (conv.kind === "integrator_brokerage") {
    const partnerName = conv.partner_id ? contactNameById?.get(conv.partner_id) : undefined;
    const orgName = conv.brokerage_org_id ? contactNameById?.get(conv.brokerage_org_id) : undefined;
    if (partnerName && orgName) return `${partnerName} · ${orgName}`;
    return partnerName ?? orgName ?? sectionTitle;
  }
  return sectionTitle;
}
