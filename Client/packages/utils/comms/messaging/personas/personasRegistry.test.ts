import { describe, expect, it } from "vitest";

import { allWorkspaceMessagingPersonas } from "./personasRegistry";
import { eligibleContactKindsForPersona } from "./types";

describe("workspace messaging personas registry", () => {
  it("every persona has sections and list kinds", () => {
    for (const persona of allWorkspaceMessagingPersonas()) {
      expect(persona.id).toBeTruthy();
      expect(persona.sections.length).toBeGreaterThan(0);
      expect(persona.listKinds.length).toBeGreaterThan(0);
      for (const section of persona.sections) {
        expect(section.kinds.length).toBeGreaterThan(0);
      }
    }
  });

  it("brokerage persona includes support and agent sections", () => {
    const brokerage = allWorkspaceMessagingPersonas().find((p) => p.id === "brokerage");
    expect(brokerage?.sections.map((s) => s.id)).toEqual(["support", "agents"]);
    expect(brokerage?.listKinds).toContain("platform_support");
    expect(brokerage?.listKinds).toContain("brokerage_agent");
    expect(brokerage?.sidebarLayout).toBe("pinned_support");
    expect(brokerage?.pinnedSupportTitle).toBe("SilverKey support");
    expect(brokerage?.supportCreateLabel).toBe("");
    expect(eligibleContactKindsForPersona(brokerage!)).toEqual(["brokerage_agent"]);
  });

  it("integrator and admin personas keep sectioned sidebar layout", () => {
    const integrator = allWorkspaceMessagingPersonas().find((p) => p.id === "integrator");
    const admin = allWorkspaceMessagingPersonas().find((p) => p.id === "admin_support");
    expect(integrator?.sidebarLayout).toBe("sectioned");
    expect(admin?.sidebarLayout).toBe("sectioned");
  });

  it("integrator persona excludes platform_support from eligible contacts", () => {
    const integrator = allWorkspaceMessagingPersonas().find((p) => p.id === "integrator");
    expect(eligibleContactKindsForPersona(integrator!)).toEqual(["integrator_brokerage"]);
  });

  it("admin persona uses admin scope and has no new conversation label", () => {
    const admin = allWorkspaceMessagingPersonas().find((p) => p.id === "admin_support");
    expect(admin?.adminScope).toBe(true);
    expect(admin?.newConversationLabel).toBe("");
    expect(eligibleContactKindsForPersona(admin!)).toEqual([]);
  });
});
