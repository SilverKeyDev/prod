import { describe, expect, it } from "vitest";

import { getMessagingSurfaceForWorkspace } from "./getMessagingSurfaceForWorkspace";

describe("getMessagingSurfaceForWorkspace (feature re-export)", () => {
  it("re-exports workspace surface mapper", () => {
    expect(getMessagingSurfaceForWorkspace("buyer")?.stack).toBe("agent_client");
  });
});
