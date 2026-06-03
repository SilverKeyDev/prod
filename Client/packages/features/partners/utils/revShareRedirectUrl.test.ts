import { describe, expect, it } from "vitest";

import {
  buildRevShareRedirectUrl,
  formatCtrPercent,
} from "packages/utils/revShare/revShareRedirectUrl";

describe("buildRevShareRedirectUrl", () => {
  it("builds /r path with query params", () => {
    const url = buildRevShareRedirectUrl("https://usesilverkey.com", {
      linkId: "abc-123",
      buyerId: "buyer-1",
      transactionId: "tx-9",
      stepId: "closing:13",
      sessionId: "sess-abc",
    });
    expect(url).toContain("/r/abc-123");
    expect(url).toContain("buyer_id=buyer-1");
    expect(url).toContain("transaction_id=tx-9");
    expect(url).toContain("step_id=closing%3A13");
    expect(url).toContain("session_id=sess-abc");
  });
});

describe("formatCtrPercent", () => {
  it("formats ratio as percent", () => {
    expect(formatCtrPercent(0.125)).toBe("12.5%");
  });
  it("returns dash for null", () => {
    expect(formatCtrPercent(null)).toBe("—");
  });
});
