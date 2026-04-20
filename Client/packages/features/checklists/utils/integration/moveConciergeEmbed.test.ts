import { describe, expect, it } from "vitest";

import {
  buildMoveConciergeEmbedUrl,
  MOVE_CONCIERGE_PARTNER_URL,
  prefillFromUserPreferencesRecord,
} from "./moveConciergeEmbed";

describe("prefillFromUserPreferencesRecord", () => {
  it("prefers auth full name over preferences name", () => {
    const prefill = prefillFromUserPreferencesRecord(
      { name: "From Prefs" },
      { authFullName: "Auth User" }
    );
    expect(prefill.fullName).toBe("Auth User");
    expect(prefill.leadType).toBe("Home Buyer");
  });

  it("reads zip and first important_locations address", () => {
    const prefill = prefillFromUserPreferencesRecord({
      ideal_zip_code: "30309",
      important_locations: [{ address: "1 Main St  " }],
    });
    expect(prefill.zip).toBe("30309");
    expect(prefill.newAddressLine).toBe("1 Main St");
  });
});

describe("buildMoveConciergeEmbedUrl", () => {
  it("returns base partner URL when prefill is empty", () => {
    expect(buildMoveConciergeEmbedUrl({})).toBe(MOVE_CONCIERGE_PARTNER_URL);
  });

  it("omits keys for undefined or blank values", () => {
    const url = buildMoveConciergeEmbedUrl({
      email: "  ",
      phone: undefined,
      fullName: "Jane Doe",
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("name")).toBe("Jane Doe");
    expect(parsed.searchParams.get("email")).toBeNull();
    expect(parsed.searchParams.get("phone")).toBeNull();
  });

  it("encodes special characters in query values", () => {
    const url = buildMoveConciergeEmbedUrl({
      email: "jane+test@example.com",
      newAddressLine: "123 Main St, Apt #4",
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("email")).toBe("jane+test@example.com");
    expect(parsed.searchParams.get("address")).toBe("123 Main St, Apt #4");
  });
});
