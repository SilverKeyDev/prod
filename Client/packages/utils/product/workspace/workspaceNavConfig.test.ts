import { describe, expect, it } from "vitest";

import { getWorkspaceNavTabs } from "./workspaceNavConfig";

describe("getWorkspaceNavTabs", () => {
  it("buyer shows search on desktop", () => {
    const keys = getWorkspaceNavTabs("buyer", false).map((t) => t.key);
    expect(keys).toContain("search");
    expect(keys).toContain("dashboard");
    expect(keys).toContain("decide");
    expect(keys).toContain("agent");
    expect(keys).toContain("profile");
  });

  it("agent shows full desktop nav", () => {
    const keys = getWorkspaceNavTabs("agent", false).map((t) => t.key);
    expect(keys).toContain("search");
    expect(keys).toContain("decide");
    expect(keys).toContain("agent");
  });

  it("brokerage shows same desktop nav tabs as buyer (no separate analytics tab)", () => {
    const keys = getWorkspaceNavTabs("brokerage", false).map((t) => t.key);
    expect(keys).toEqual(["dashboard", "search", "decide", "agent", "profile"]);
    expect(keys).not.toContain("analytics");
  });

  it("seller, renter, brokerage, and integration_partner show full desktop nav (no longer placeholders)", () => {
    for (const ws of ["seller", "renter", "brokerage", "integration_partner"] as const) {
      const keys = getWorkspaceNavTabs(ws, false).map((t) => t.key);
      expect(keys).toContain("dashboard");
      expect(keys).toContain("search");
      expect(keys).toContain("agent");
      expect(keys).toContain("profile");
    }
  });

  it("graduated workspaces use workspace-specific dashboard and messaging label keys", () => {
    const sellerTabs = getWorkspaceNavTabs("seller", false);
    expect(sellerTabs.find((t) => t.key === "dashboard")?.labelKey).toBe(
      "workspace.nav.dashboard.seller"
    );
    expect(sellerTabs.find((t) => t.key === "agent")?.labelKey).toBe(
      "workspace.nav.messaging.seller"
    );

    const renterTabs = getWorkspaceNavTabs("renter", false);
    expect(renterTabs.find((t) => t.key === "dashboard")?.labelKey).toBe(
      "workspace.nav.dashboard.renter"
    );
    expect(renterTabs.find((t) => t.key === "agent")?.labelKey).toBe(
      "workspace.nav.messaging.renter"
    );
  });

  it("shows full mobile nav including profile for buyer and agent", () => {
    for (const ws of ["buyer", "agent"] as const) {
      const keys = getWorkspaceNavTabs(ws, true).map((t) => t.key);
      expect(keys).toEqual(["dashboard", "search", "decide", "agent", "profile"]);
    }
  });
});
