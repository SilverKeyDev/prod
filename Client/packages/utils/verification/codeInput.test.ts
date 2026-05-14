import { describe, expect, it } from "vitest";

import { applyCodeChange, applyPaste, getBackspaceFocusIndex } from "./codeInput";

describe("applyCodeChange", () => {
  it("inserts a digit and advances focus when not last cell", () => {
    const code = ["", "", "", "", "", ""];
    const { nextCode, nextFocusIndex } = applyCodeChange(code, "5", 0);
    expect(nextCode[0]).toBe("5");
    expect(nextFocusIndex).toBe(1);
  });

  it("strips non-digits and uses last digit only", () => {
    const code = ["", "", "", "", "", ""];
    const { nextCode } = applyCodeChange(code, "a12b", 2);
    expect(nextCode[2]).toBe("2");
  });

  it("keeps focus on last index when row is complete", () => {
    const code = ["1", "2", "3", "4", "5", ""];
    const { nextCode, nextFocusIndex } = applyCodeChange(code, "6", 5);
    expect(nextCode[5]).toBe("6");
    expect(nextFocusIndex).toBe(5);
  });
});

describe("applyPaste", () => {
  it("returns unchanged when paste has no digits", () => {
    const code = ["1", "", "", "", "", ""];
    const { nextCode, nextFocusIndex } = applyPaste(code, "abc", 1);
    expect(nextCode).toEqual(code);
    expect(nextFocusIndex).toBe(1);
  });

  it("fills from startIndex and moves focus to next empty", () => {
    const code = ["", "", "", "", "", ""];
    const { nextCode, nextFocusIndex } = applyPaste(code, "123", 0);
    expect(nextCode.slice(0, 3)).toEqual(["1", "2", "3"]);
    expect(nextFocusIndex).toBe(3);
  });

  it("caps at six digits", () => {
    const code = ["", "", "", "", "", ""];
    const { nextCode } = applyPaste(code, "1234567890", 0);
    expect(nextCode.join("")).toBe("123456");
  });
});

describe("getBackspaceFocusIndex", () => {
  it("returns previous index when current empty and not first", () => {
    expect(getBackspaceFocusIndex(["1", "", "3"], 1)).toBe(0);
  });

  it("returns null when index zero or cell has content", () => {
    expect(getBackspaceFocusIndex(["", "2"], 1)).toBeNull();
    expect(getBackspaceFocusIndex(["", ""], 0)).toBeNull();
  });
});
