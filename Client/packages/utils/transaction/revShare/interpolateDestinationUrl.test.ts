import { describe, expect, it } from "vitest";

import { interpolateDestinationUrl } from "./interpolateDestinationUrl";

describe("interpolateDestinationUrl", () => {
  it("replaces allowed placeholders", () => {
    const url = interpolateDestinationUrl("https://p.example/{link_id}?tx={transaction_id}", {
      linkId: "link-1",
      transactionId: "tx-9",
    });
    expect(url).toBe("https://p.example/link-1?tx=tx-9");
  });

  it("leaves unknown placeholders unchanged", () => {
    const url = interpolateDestinationUrl("https://p.example/{unknown}", {
      linkId: "link-1",
    });
    expect(url).toBe("https://p.example/{unknown}");
  });
});
