import { describe, expect, it } from "vitest";

import { unknownToNumberOrString, unknownToString } from "./unknownCoercion";

describe("unknownToNumberOrString", () => {
  it("returns strings and numbers as-is", () => {
    expect(unknownToNumberOrString("12")).toBe("12");
    expect(unknownToNumberOrString(3)).toBe(3);
  });

  it("returns undefined for nullish and objects", () => {
    expect(unknownToNumberOrString(null)).toBeUndefined();
    expect(unknownToNumberOrString(undefined)).toBeUndefined();
    expect(unknownToNumberOrString({})).toBeUndefined();
    expect(unknownToNumberOrString([])).toBeUndefined();
  });

  it("stringifies booleans", () => {
    expect(unknownToNumberOrString(true)).toBe("true");
  });
});

describe("unknownToString", () => {
  it("returns strings and stringifies numbers", () => {
    expect(unknownToString("x")).toBe("x");
    expect(unknownToString(0)).toBe("0");
  });

  it("returns undefined for objects", () => {
    expect(unknownToString({ a: 1 })).toBeUndefined();
  });

  it("stringifies booleans", () => {
    expect(unknownToString(false)).toBe("false");
  });
});
