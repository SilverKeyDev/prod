import { describe, expect, it } from "vitest";

import {
  buildClientHubPath,
  generateClientHubIdSlug,
  generateClientHubNameSlug,
  parseClientHubPathname,
  resolveClientHubRouteClientId,
} from "./clientHubSlug";

const SAMPLE_UUID = "550e8400-e29b-41d4-a716-446655440000";

const CLIENTS = [
  { id: SAMPLE_UUID, name: "Jordan Client" },
  { id: "c3d4e5f6-a7b8-9012-cdef-345678901234", name: "Alex Buyer" },
] as const;

describe("generateClientHubNameSlug", () => {
  it("normalizes display name", () => {
    expect(generateClientHubNameSlug("Jordan Q. Client!")).toBe("jordan-q-client");
  });
});

describe("generateClientHubIdSlug", () => {
  it("uses the last UUID segment", () => {
    expect(generateClientHubIdSlug(SAMPLE_UUID)).toBe("446655440000");
  });
});

describe("buildClientHubPath", () => {
  it("builds name slug then id slug", () => {
    expect(buildClientHubPath(SAMPLE_UUID, "Jordan Client")).toBe(
      "/dashboard/client/jordan-client/446655440000"
    );
  });
});

describe("parseClientHubPathname", () => {
  it("parses two-segment hub URLs", () => {
    expect(parseClientHubPathname("/dashboard/client/jordan-client/446655440000")).toEqual({
      kind: "segments",
      nameSlug: "jordan-client",
      idSlug: "446655440000",
    });
  });

  it("parses legacy single-segment URLs", () => {
    expect(parseClientHubPathname(`/dashboard/client/${SAMPLE_UUID}`)).toEqual({
      kind: "legacy",
      segment: SAMPLE_UUID,
    });
  });
});

describe("resolveClientHubRouteClientId", () => {
  it("resolves canonical segments", () => {
    const parsed = parseClientHubPathname("/dashboard/client/jordan-client/446655440000");
    expect(parsed && resolveClientHubRouteClientId(CLIENTS, parsed)).toBe(SAMPLE_UUID);
  });

  it("resolves legacy uuid segment", () => {
    const parsed = parseClientHubPathname(`/dashboard/client/${SAMPLE_UUID}`);
    expect(parsed && resolveClientHubRouteClientId(CLIENTS, parsed)).toBe(SAMPLE_UUID);
  });

  it("returns null for unknown slug pair", () => {
    const parsed = parseClientHubPathname("/dashboard/client/unknown/000000000000");
    expect(parsed && resolveClientHubRouteClientId(CLIENTS, parsed)).toBeNull();
  });
});
