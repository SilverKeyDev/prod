import { describe, expect, it } from "vitest";

import { buildAgentProfileUrl, generateAgentProfileSlug, parseAgentProfileUrl } from "./slug";

describe("generateAgentProfileSlug", () => {
  it("normalizes display name to a URL segment", () => {
    expect(generateAgentProfileSlug("Jane Q. Agent!")).toBe("jane-q-agent");
  });
});

describe("buildAgentProfileUrl", () => {
  it("includes id and slug", () => {
    expect(buildAgentProfileUrl("uuid-1", "Jane Agent")).toBe("/agent-profile/uuid-1/jane-agent");
  });
});

describe("parseAgentProfileUrl", () => {
  it("parses path with optional slug", () => {
    expect(parseAgentProfileUrl("/agent-profile/abc/def-gh")).toEqual({
      agentId: "abc",
      slug: "def-gh",
    });
  });

  it("parses id only", () => {
    expect(parseAgentProfileUrl("/agent-profile/abc")).toEqual({
      agentId: "abc",
      slug: undefined,
    });
  });
});
