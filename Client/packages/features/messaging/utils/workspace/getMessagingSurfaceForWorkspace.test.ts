import { describe, expect, it } from "vitest";

import { getMessagingSurfaceForWorkspace } from "./getMessagingSurfaceForWorkspace";

describe("getMessagingSurfaceForWorkspace", () => {
  it("maps buyer, seller, and renter to agent_client stack", () => {
    expect(getMessagingSurfaceForWorkspace("buyer")).toEqual({
      stack: "agent_client",
      clientPersona: "buyer",
    });
    expect(getMessagingSurfaceForWorkspace("seller")).toEqual({
      stack: "agent_client",
      clientPersona: "seller",
    });
    expect(getMessagingSurfaceForWorkspace("renter")).toEqual({
      stack: "agent_client",
      clientPersona: "renter",
    });
  });

  it("maps brokerage and integration_partner to workspace stack", () => {
    expect(getMessagingSurfaceForWorkspace("brokerage")).toEqual({
      stack: "workspace",
      persona: "brokerage",
    });
    expect(getMessagingSurfaceForWorkspace("integration_partner")).toEqual({
      stack: "workspace",
      persona: "integrator",
    });
  });

  it("returns null for agent workspace", () => {
    expect(getMessagingSurfaceForWorkspace("agent")).toBeNull();
  });
});
