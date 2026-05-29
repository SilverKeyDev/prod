import { describe, expect, it } from "vitest";

import { normalizePartnerIntegrationDisplayMode, partnerShowsIframe } from "./integrationDisplay";

describe("integrationDisplay", () => {
  it("defaults unknown modes to iframe_and_link", () => {
    expect(normalizePartnerIntegrationDisplayMode(undefined)).toBe("iframe_and_link");
    expect(normalizePartnerIntegrationDisplayMode("invalid")).toBe("iframe_and_link");
  });

  it("partnerShowsIframe reflects display mode", () => {
    expect(partnerShowsIframe("iframe_and_link")).toBe(true);
    expect(partnerShowsIframe("link_only")).toBe(false);
  });
});
