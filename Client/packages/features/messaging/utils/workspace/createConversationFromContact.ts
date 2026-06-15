import type {
  CreateWorkspaceConversationRequest,
  EligibleContact,
} from "packages/features/messaging/api/workspaceConversations";

/** Build create payload from an eligible-contacts row. */
export function createConversationPayloadFromContact(
  contact: EligibleContact
): CreateWorkspaceConversationRequest {
  const metadata = contact.metadata ?? {};

  if (contact.kind === "brokerage_agent") {
    const brokerageOrgId = metadata.brokerage_org_id;
    if (typeof brokerageOrgId !== "string" || !brokerageOrgId) {
      throw new Error("brokerage_org_id required for agent contact");
    }
    if (contact.contact_type === "self_agent") {
      throw new Error("Cannot start a thread with yourself");
    }
    return {
      kind: "brokerage_agent",
      brokerage_org_id: brokerageOrgId,
      agent_user_id: contact.contact_id,
    };
  }

  if (contact.kind === "integrator_brokerage") {
    if (contact.contact_type === "brokerage") {
      const partnerId = metadata.partner_id;
      if (typeof partnerId !== "string" || !partnerId) {
        throw new Error("partner_id required for brokerage contact");
      }
      return {
        kind: "integrator_brokerage",
        brokerage_org_id: contact.contact_id,
        partner_id: partnerId,
      };
    }
    if (contact.contact_type === "integrator_partner") {
      const orgId = metadata.brokerage_org_id;
      if (typeof orgId !== "string" || !orgId) {
        throw new Error("brokerage_org_id required for integrator contact");
      }
      return {
        kind: "integrator_brokerage",
        partner_id: contact.contact_id,
        brokerage_org_id: orgId,
      };
    }
  }

  throw new Error(`Unsupported eligible contact: ${contact.contact_type}/${contact.kind}`);
}

/** Contacts that should not appear in the new-conversation picker. */
export function isActionableEligibleContact(contact: EligibleContact): boolean {
  return contact.contact_type !== "self_agent";
}
