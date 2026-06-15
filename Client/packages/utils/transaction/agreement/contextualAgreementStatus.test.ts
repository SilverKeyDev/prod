import { describe, expect, it } from "vitest";

import { getContextualAgreementStatus, getNextSignerUserId } from "./contextualAgreementStatus";

const baseParticipants = (
  clientSigned: boolean,
  agentSigned: boolean
): NonNullable<Parameters<typeof getContextualAgreementStatus>[0]["participants"]> => [
  {
    user_id: "buyer-1",
    role: "signer",
    routing_order: 1,
    recipient_status: clientSigned ? "signed" : "sent",
  },
  {
    user_id: "agent-1",
    role: "signer",
    routing_order: 2,
    recipient_status: agentSigned ? "signed" : "pending",
  },
];

describe("getNextSignerUserId", () => {
  it("returns first unsigned signer by routing order", () => {
    expect(getNextSignerUserId(baseParticipants(false, false))).toBe("buyer-1");
    expect(getNextSignerUserId(baseParticipants(true, false))).toBe("agent-1");
    expect(getNextSignerUserId(baseParticipants(true, true))).toBeNull();
  });

  it("returns null when the next signer is identified by email only", () => {
    expect(
      getNextSignerUserId([
        {
          email: "buyer@test.com",
          role: "signer",
          routing_order: 1,
          recipient_status: "sent",
        },
      ])
    ).toBeNull();
  });
});

describe("getContextualAgreementStatus", () => {
  it("only marks the current routing recipient as sign_now", () => {
    const agreement = {
      status: "sent",
      participants: baseParticipants(false, false),
      buyer_id: "buyer-1",
    };
    expect(getContextualAgreementStatus(agreement, "buyer-1", false)).toBe("sign_now");
    expect(getContextualAgreementStatus(agreement, "agent-1", true)).toBe("waiting_for_signature");
  });

  it("after client signs, agent is sign_now and client is waiting_for_review", () => {
    const agreement = {
      status: "signed",
      participants: baseParticipants(true, false),
      buyer_id: "buyer-1",
    };
    expect(getContextualAgreementStatus(agreement, "buyer-1", false)).toBe("waiting_for_review");
    expect(getContextualAgreementStatus(agreement, "agent-1", true)).toBe("sign_now");
  });

  it("treats the viewer as sign_now when matched by email but user_id is absent on the recipient", () => {
    const agreement = {
      status: "sent",
      participants: [
        {
          email: "buyer@test.com",
          role: "signer",
          routing_order: 1,
          recipient_status: "sent",
        },
        {
          user_id: "agent-1",
          role: "signer",
          routing_order: 2,
          recipient_status: "pending",
        },
      ],
      buyer_id: null,
    };
    expect(
      getContextualAgreementStatus(agreement, "buyer-sk-user-id", false, "buyer@test.com")
    ).toBe("sign_now");
    expect(getContextualAgreementStatus(agreement, "agent-1", true)).toBe("waiting_for_signature");
  });
});
