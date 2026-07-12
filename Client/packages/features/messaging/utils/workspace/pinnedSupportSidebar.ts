import type {
  EligibleContact,
  WorkspaceConversation,
} from "packages/features/messaging/api/workspaceConversations";

/** First platform_support thread in a conversation list (at most one per subject). */
export function findPlatformSupportConversation(
  conversations: readonly WorkspaceConversation[]
): WorkspaceConversation | undefined {
  return conversations.find((c) => c.kind === "platform_support");
}

/** Non-support threads for a flat inbox under the pinned support row. */
export function nonSupportConversations(
  conversations: readonly WorkspaceConversation[]
): WorkspaceConversation[] {
  return conversations.filter((c) => c.kind !== "platform_support");
}

/**
 * Eligible contacts that do not already have an open thread
 * (matched by contact_id against agent_user_id / brokerage_org_id / partner_id).
 */
export function eligibleContactsWithoutOpenThread(
  contacts: readonly EligibleContact[],
  conversations: readonly WorkspaceConversation[]
): EligibleContact[] {
  const openIds = new Set<string>();
  for (const conv of conversations) {
    if (conv.kind === "platform_support") continue;
    if (conv.agent_user_id) openIds.add(conv.agent_user_id);
    if (conv.brokerage_org_id) openIds.add(conv.brokerage_org_id);
    if (conv.partner_id) openIds.add(conv.partner_id);
  }
  return contacts.filter((c) => !openIds.has(c.contact_id));
}
