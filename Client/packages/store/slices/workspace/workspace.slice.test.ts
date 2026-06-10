import { beforeEach, describe, expect, it } from "vitest";

import { useWorkspaceStore } from "./workspace.slice";

describe("useWorkspaceStore", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
  });

  it("syncFromIdentity allows agent and brokerage shells for agents with orgs", () => {
    useWorkspaceStore.getState().syncFromIdentity({
      user: {
        roles: ["agent"],
        brokerage_org_ids: ["org-1"],
      },
    });

    const { allowedWorkspaces, activeWorkspace } = useWorkspaceStore.getState();
    expect(allowedWorkspaces).toContain("agent");
    expect(allowedWorkspaces).toContain("brokerage");
    expect(activeWorkspace).toBeTruthy();
  });

  it("syncFromIdentity resets to buyer-only when user is cleared", () => {
    useWorkspaceStore.getState().syncFromIdentity({
      user: { roles: ["agent"], brokerage_org_ids: ["org-1"] },
    });

    useWorkspaceStore.getState().syncFromIdentity({ user: null });

    const state = useWorkspaceStore.getState();
    expect(state.allowedWorkspaces).toEqual(["buyer"]);
    expect(state.activeWorkspace).toBe("buyer");
  });

  it("setActiveWorkspace ignores disallowed workspace", () => {
    useWorkspaceStore.getState().syncFromIdentity({
      user: { roles: [], brokerage_org_ids: [] },
    });

    useWorkspaceStore.getState().setActiveWorkspace("brokerage");
    expect(useWorkspaceStore.getState().activeWorkspace).toBe("buyer");
  });
});
