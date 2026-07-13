import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();

vi.mock("packages/services/http", () => ({
  apiGet: (...args: unknown[]) => apiGet(...args),
}));

import {
  buildAnalyticsQueryUrl,
  buildInventoryQueryUrl,
  fetchAncillaryAnalytics,
  fetchBrokerageAnalyticsOverview,
  fetchBrokerageInventory,
  fetchDealFailureForensics,
} from "./analytics";

describe("brokerage analytics API client", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiGet.mockResolvedValue({ success: true });
  });

  it("builds URLs with brokerage_org_id and timeline", () => {
    const url = buildAnalyticsQueryUrl("overview", {
      brokerageOrgId: "org-123",
      timeline: "week",
    });
    expect(url).toContain("/api/v1/brokerage/analytics/overview?");
    expect(url).toContain("brokerage_org_id=org-123");
    expect(url).toContain("timeline=week");
  });

  it("passes timeline on overview fetch", async () => {
    await fetchBrokerageAnalyticsOverview({
      brokerageOrgId: "org-abc",
      timeline: "year",
    });
    expect(apiGet).toHaveBeenCalledWith(expect.stringMatching(/timeline=year/));
    expect(apiGet).toHaveBeenCalledWith(expect.stringMatching(/brokerage_org_id=org-abc/));
  });

  it("passes timeline on ancillary and deal-failure fetches", async () => {
    await fetchAncillaryAnalytics({ brokerageOrgId: "org-1", timeline: "month" });
    await fetchDealFailureForensics({ brokerageOrgId: "org-1", timeline: "5years" });
    expect(apiGet.mock.calls[0]?.[0]).toContain("timeline=month");
    expect(apiGet.mock.calls[0]?.[0]).toContain("/ancillary?");
    expect(apiGet.mock.calls[1]?.[0]).toContain("timeline=5years");
    expect(apiGet.mock.calls[1]?.[0]).toContain("/deal-failure?");
  });

  it("builds inventory URLs with optional status", () => {
    const all = buildInventoryQueryUrl({ brokerageOrgId: "org-inv" });
    expect(all).toContain("/api/v1/brokerage/analytics/inventory?");
    expect(all).toContain("brokerage_org_id=org-inv");
    expect(all).not.toContain("status=");

    const active = buildInventoryQueryUrl({ brokerageOrgId: "org-inv", status: "active" });
    expect(active).toContain("status=active");
  });

  it("fetches inventory by brokerage org id", async () => {
    await fetchBrokerageInventory({ brokerageOrgId: "org-map", status: "pending" });
    expect(apiGet).toHaveBeenCalledWith(expect.stringMatching(/\/inventory\?/));
    expect(apiGet).toHaveBeenCalledWith(expect.stringMatching(/brokerage_org_id=org-map/));
    expect(apiGet).toHaveBeenCalledWith(expect.stringMatching(/status=pending/));
  });
});
