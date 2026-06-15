import { describe, expect, it } from "vitest";

import {
  buildAgentProfileUrl,
  generateAgentProfileSlug,
  parseAgentProfileUrl,
  resolveAgentProfileRouteParams,
} from "./slug";

describe("generateAgentProfileSlug", () => {
  it("normalizes display name to a URL segment", () => {
    expect(generateAgentProfileSlug("Jane Q. Agent!")).toBe("jane-q-agent");
  });
});

describe("buildAgentProfileUrl", () => {
  it("uses name slug then brief segment (agent id)", () => {
    expect(buildAgentProfileUrl("uuid-1", "Jane Agent")).toBe("/agent-profile/jane-agent/uuid-1");
  });

  it("uses short /a path when a public slug is provided", () => {
    expect(buildAgentProfileUrl("uuid-1", "Jane Agent", "jane-agent")).toBe("/a/jane-agent");
  });
});

describe("parseAgentProfileUrl", () => {
  it("parses name and briefSlug segments", () => {
    expect(parseAgentProfileUrl("/agent-profile/jane-q-agent/abc-def")).toEqual({
      name: "jane-q-agent",
      briefSlug: "abc-def",
    });
  });

  it("returns null without both segments", () => {
    expect(parseAgentProfileUrl("/agent-profile/only-one")).toBeNull();
  });
});

const SAMPLE_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("resolveAgentProfileRouteParams", () => {
  it("uses second segment as user id for name-first URLs", () => {
    expect(resolveAgentProfileRouteParams("jane-agent", SAMPLE_UUID)).toEqual({
      agentUserId: SAMPLE_UUID,
    });
  });

  it("returns null when a segment is missing", () => {
    expect(resolveAgentProfileRouteParams("", SAMPLE_UUID)).toEqual({
      agentUserId: null,
    });
  });

  it("uses opaque second segment when neither segment is a UUID", () => {
    expect(resolveAgentProfileRouteParams("jane-agent", "uuid-1")).toEqual({
      agentUserId: "uuid-1",
    });
  });
});
