import { describe, expect, it } from "vitest";

import {
  buildBrokerageAgentAnalyticsPath,
  getCanonicalAgentSlug,
  isLegacyAgentId,
  resolveBrokerageAgentIdFromSlug,
} from "./brokerageAgentAnalyticsSlug";

const SAMPLE_AGENTS = [
  { id: "agent-6", name: "Mark Parker PhD" },
  { id: "agent-27", name: "Dean Houston" },
  { id: "agent-337", name: "Nicole Michael" },
  { id: "agent-226", name: "Amber Edwards" },
] as const;

describe("buildBrokerageAgentAnalyticsPath", () => {
  it("builds name-only slug path", () => {
    expect(buildBrokerageAgentAnalyticsPath("agent-6", "Mark Parker PhD")).toBe(
      "/dashboard/agent/mark-parker-phd"
    );
  });

  it("handles empty name gracefully", () => {
    expect(buildBrokerageAgentAnalyticsPath("agent-6", "")).toBe("/dashboard/agent/agent");
  });

  it("normalizes special characters", () => {
    expect(buildBrokerageAgentAnalyticsPath("agent-1", "John O'Connor Jr.")).toBe(
      "/dashboard/agent/john-oconnor-jr"
    );
  });
});

describe("getCanonicalAgentSlug", () => {
  it("generates consistent slugs", () => {
    expect(getCanonicalAgentSlug("Mark Parker PhD")).toBe("mark-parker-phd");
    expect(getCanonicalAgentSlug("Dean Houston")).toBe("dean-houston");
  });
});

describe("isLegacyAgentId", () => {
  it("identifies legacy agent-N format", () => {
    expect(isLegacyAgentId("agent-6")).toBe(true);
    expect(isLegacyAgentId("agent-337")).toBe(true);
  });

  it("rejects name slugs", () => {
    expect(isLegacyAgentId("mark-parker-phd")).toBe(false);
    expect(isLegacyAgentId("dean-houston")).toBe(false);
  });

  it("rejects invalid formats", () => {
    expect(isLegacyAgentId("agent")).toBe(false);
    expect(isLegacyAgentId("agent-")).toBe(false);
    expect(isLegacyAgentId("agent-abc")).toBe(false);
  });
});

describe("resolveBrokerageAgentIdFromSlug", () => {
  it("resolves canonical name slugs", () => {
    expect(resolveBrokerageAgentIdFromSlug(SAMPLE_AGENTS, "mark-parker-phd")).toBe("agent-6");
    expect(resolveBrokerageAgentIdFromSlug(SAMPLE_AGENTS, "dean-houston")).toBe("agent-27");
    expect(resolveBrokerageAgentIdFromSlug(SAMPLE_AGENTS, "nicole-michael")).toBe("agent-337");
  });

  it("resolves legacy agent-N IDs", () => {
    expect(resolveBrokerageAgentIdFromSlug(SAMPLE_AGENTS, "agent-6")).toBe("agent-6");
    expect(resolveBrokerageAgentIdFromSlug(SAMPLE_AGENTS, "agent-27")).toBe("agent-27");
  });

  it("returns null for unknown slugs", () => {
    expect(resolveBrokerageAgentIdFromSlug(SAMPLE_AGENTS, "unknown-agent")).toBeNull();
    expect(resolveBrokerageAgentIdFromSlug(SAMPLE_AGENTS, "agent-999")).toBeNull();
  });

  it("returns null for empty or invalid input", () => {
    expect(resolveBrokerageAgentIdFromSlug(SAMPLE_AGENTS, "")).toBeNull();
    expect(resolveBrokerageAgentIdFromSlug(SAMPLE_AGENTS, "   ")).toBeNull();
  });

  it("handles case sensitivity", () => {
    expect(resolveBrokerageAgentIdFromSlug(SAMPLE_AGENTS, "MARK-PARKER-PHD")).toBe("agent-6");
    expect(resolveBrokerageAgentIdFromSlug(SAMPLE_AGENTS, "Dean-Houston")).toBe("agent-27");
  });
});
