import { describe, expect, it } from "vitest";

import { parseKidsAgesString, serializeKidsAgesTags } from "./buyerKidsAges";

describe("buyerKidsAges", () => {
  it("parses comma-separated ages", () => {
    expect(parseKidsAgesString("5, 7")).toEqual(["5", "7"]);
  });

  it("parses and-separated ages", () => {
    expect(parseKidsAgesString("8 and 12")).toEqual(["8", "12"]);
  });

  it("serializes tags to comma-separated string", () => {
    expect(serializeKidsAgesTags(["6", "9"])).toBe("6, 9");
  });

  it("round-trips through parse and serialize", () => {
    const serialized = serializeKidsAgesTags(["8", "12"]);
    expect(parseKidsAgesString(serialized)).toEqual(["8", "12"]);
  });
});
