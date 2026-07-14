import { describe, expect, it } from "vitest";

import { allWorkspaceMessagingPersonas } from "packages/utils/comms/messaging/personas/personasRegistry";
import { eligibleContactKindsForPersona } from "packages/utils/comms/messaging/personas/types";

describe("workspace messaging personas registry (feature re-export)", () => {
  it("re-exports registry personas", () => {
    expect(allWorkspaceMessagingPersonas().length).toBeGreaterThan(0);
    const brokerage = allWorkspaceMessagingPersonas().find((p) => p.id === "brokerage");
    expect(eligibleContactKindsForPersona(brokerage!)).toEqual(["brokerage_agent"]);
  });
});
