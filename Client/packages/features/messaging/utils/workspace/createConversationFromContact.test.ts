import { describe, expect, it } from "vitest";

import {
  createConversationPayloadFromContact,
  isActionableEligibleContact,
} from "./createConversationFromContact";

describe("createConversationFromContact", () => {
  it("builds brokerage_agent payload from agent contact", () => {
    expect(
      createConversationPayloadFromContact({
        contact_id: "agent-1",
        contact_type: "agent",
        display_name: "Agent One",
        kind: "brokerage_agent",
        metadata: { brokerage_org_id: "org-1" },
      })
    ).toEqual({
      kind: "brokerage_agent",
      brokerage_org_id: "org-1",
      agent_user_id: "agent-1",
    });
  });

  it("builds integrator_brokerage payload from brokerage contact", () => {
    expect(
      createConversationPayloadFromContact({
        contact_id: "org-1",
        contact_type: "brokerage",
        display_name: "Acme Realty",
        kind: "integrator_brokerage",
        metadata: { partner_id: "partner-1" },
      })
    ).toEqual({
      kind: "integrator_brokerage",
      brokerage_org_id: "org-1",
      partner_id: "partner-1",
    });
  });

  it("rejects self_agent contacts", () => {
    expect(() =>
      createConversationPayloadFromContact({
        contact_id: "me",
        contact_type: "self_agent",
        display_name: "You",
        kind: "brokerage_agent",
        metadata: { brokerage_org_id: "org-1" },
      })
    ).toThrow(/yourself/);
  });

  it("filters self_agent from actionable contacts", () => {
    expect(
      isActionableEligibleContact({
        contact_id: "me",
        contact_type: "self_agent",
        display_name: "You",
        kind: "brokerage_agent",
      })
    ).toBe(false);
  });
});
