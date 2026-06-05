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

  it("brokerage shows analytics tab on desktop", () => {
    const tabs = getWorkspaceNavTabs("brokerage", false);
    const keys = tabs.map((t) => t.key);
    expect(keys).toContain("analytics");
    expect(tabs.find((t) => t.key === "analytics")?.labelKey).toBe(
      "workspace.nav.analytics.brokerage"
    );
  });

  it("buyer and agent hide analytics tab", () => {
    for (const ws of ["buyer", "agent", "seller", "integration_partner"] as const) {
      const keys = getWorkspaceNavTabs(ws, false).map((t) => t.key);
      expect(keys).not.toContain("analytics");
    }
  });

  it("seller, brokerage, and integration_partner show full desktop nav (no longer placeholders)", () => {
    for (const ws of ["seller", "brokerage", "integration_partner"] as const) {
      const keys = getWorkspaceNavTabs(ws, false).map((t) => t.key);
      expect(keys).toContain("dashboard");
      expect(keys).toContain("search");
      expect(keys).toContain("agent");
      expect(keys).toContain("profile");
    }
  });

  it("graduated workspaces use workspace-specific dashboard and messaging label keys", () => {
    const tabs = getWorkspaceNavTabs("seller", false);
    expect(tabs.find((t) => t.key === "dashboard")?.labelKey).toBe(
      "workspace.nav.dashboard.seller"
    );
    expect(tabs.find((t) => t.key === "agent")?.labelKey).toBe("workspace.nav.messaging.seller");
  });

  it("hides profile on mobile for buyer and agent", () => {
    for (const ws of ["buyer", "agent"] as const) {
      const keys = getWorkspaceNavTabs(ws, true).map((t) => t.key);
      expect(keys).not.toContain("profile");
    }
  });
});
