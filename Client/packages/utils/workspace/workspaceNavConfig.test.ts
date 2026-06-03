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

  it("placeholder workspaces show dashboard and messaging on desktop and mobile", () => {
    for (const ws of ["seller", "brokerage", "integration_partner"] as const) {
      expect(getWorkspaceNavTabs(ws, false).map((t) => t.key)).toEqual(["dashboard", "agent"]);
      expect(getWorkspaceNavTabs(ws, true).map((t) => t.key)).toEqual(["dashboard", "agent"]);
    }
  });

  it("placeholder workspaces use generic dashboard and messaging label keys", () => {
    const tabs = getWorkspaceNavTabs("seller", false);
    expect(tabs.find((t) => t.key === "dashboard")?.labelKey).toBe(
      "workspace.nav.dashboard.placeholder"
    );
    expect(tabs.find((t) => t.key === "agent")?.labelKey).toBe(
      "workspace.nav.messaging.placeholder"
    );
  });

  it("shows full mobile nav including profile for buyer and agent", () => {
    for (const ws of ["buyer", "agent"] as const) {
      const keys = getWorkspaceNavTabs(ws, true).map((t) => t.key);
      expect(keys).toEqual(["dashboard", "search", "decide", "agent", "profile"]);
    }
  });
});
