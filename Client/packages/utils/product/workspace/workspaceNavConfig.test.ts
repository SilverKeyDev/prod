import { describe, expect, it } from "vitest";

import { getWorkspaceNavTabs } from "./workspaceNavConfig";

describe("getWorkspaceNavTabs", () => {
  it("buyer shows search on desktop and excludes inventory/campaigns", () => {
    const keys = getWorkspaceNavTabs("buyer", false).map((t) => t.key);
    expect(keys).toContain("search");
    expect(keys).toContain("dashboard");
    expect(keys).toContain("decide");
    expect(keys).toContain("agent");
    expect(keys).toContain("profile");
    expect(keys).not.toContain("inventory");
    expect(keys).not.toContain("campaigns");
  });

  it("agent shows full desktop nav without inventory/campaigns", () => {
    const keys = getWorkspaceNavTabs("agent", false).map((t) => t.key);
    expect(keys).toContain("search");
    expect(keys).toContain("decide");
    expect(keys).toContain("agent");
    expect(keys).not.toContain("inventory");
    expect(keys).not.toContain("campaigns");
  });

  it("brokerage shows Campaigns and hides Search and Inventory", () => {
    const keys = getWorkspaceNavTabs("brokerage", false).map((t) => t.key);
    expect(keys).toEqual(["dashboard", "campaigns", "decide", "agent", "profile"]);
    expect(keys).not.toContain("search");
    expect(keys).not.toContain("inventory");
    expect(keys).not.toContain("analytics");
  });

  it("seller, renter, and integration_partner keep Search and exclude inventory/campaigns", () => {
    for (const ws of ["seller", "renter", "integration_partner"] as const) {
      const keys = getWorkspaceNavTabs(ws, false).map((t) => t.key);
      expect(keys).toContain("dashboard");
      expect(keys).toContain("search");
      expect(keys).toContain("agent");
      expect(keys).toContain("profile");
      expect(keys).not.toContain("inventory");
      expect(keys).not.toContain("campaigns");
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
