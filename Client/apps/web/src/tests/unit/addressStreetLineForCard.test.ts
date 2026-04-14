import { describe, expect, it } from "vitest";

import {
  addressStreetLineForCard,
  formatFilenameToAddress,
} from "packages/utils/format/property/addressFormatting";

describe("addressStreetLineForCard", () => {
  it("returns first segment for comma-separated US addresses", () => {
    expect(
      addressStreetLineForCard("123 Main St, Springfield, IL, 62701"),
    ).toBe("123 Main St");
    expect(
      addressStreetLineForCard("777 W Middlefield Rd, Mountain View, CA, 94043"),
    ).toBe("777 W Middlefield Rd");
  });

  it("strips trailing state + ZIP on a single segment", () => {
    expect(addressStreetLineForCard("123 Oak Ave Springfield IL 62701")).toBe(
      "123 Oak Ave Springfield",
    );
  });

  it("handles CA94043 in one trailing segment after city", () => {
    expect(
      addressStreetLineForCard("99 Pine Rd, Boulder, CO 80301"),
    ).toBe("99 Pine Rd");
  });

  it("returns plain street when no city part", () => {
    expect(addressStreetLineForCard("456 Elm St")).toBe("456 Elm St");
  });

  it("uses formatFilenameToAddress output with commas", () => {
    const full = formatFilenameToAddress(
      "10421f3ef19c483a9abcdef_456_Maple_Ln_Portland_OR_97201_USA.pdf",
    );
    expect(full).toContain(",");
    expect(addressStreetLineForCard(full)).toBe("456 Maple Ln");
  });

  it("accepts numeric address ids as string-coercible", () => {
    expect(addressStreetLineForCard(123 as unknown as number)).toBe("123");
  });
});
