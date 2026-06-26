import { describe, expect, it } from "vitest";

import {
  isNonSession401Error,
  NON_SESSION_401_ERROR_CODES,
  parse401ErrorCode,
} from "./nonSession401Errors";

describe("nonSession401Errors", () => {
  it("lists known integration auth error codes", () => {
    expect(NON_SESSION_401_ERROR_CODES).toContain("GOOGLE_RECONNECT_REQUIRED");
    expect(NON_SESSION_401_ERROR_CODES).toContain("client_permission_required");
  });

  describe("isNonSession401Error", () => {
    it("returns true for integration reconnect codes", () => {
      expect(isNonSession401Error("GOOGLE_RECONNECT_REQUIRED")).toBe(true);
      expect(isNonSession401Error("client_permission_required")).toBe(true);
    });

    it("returns false for session auth codes and undefined", () => {
      expect(isNonSession401Error("TOKEN_EXPIRED")).toBe(false);
      expect(isNonSession401Error("UNAUTHORIZED")).toBe(false);
      expect(isNonSession401Error(undefined)).toBe(false);
    });
  });

  describe("parse401ErrorCode", () => {
    it("extracts error from JSON response body", () => {
      expect(
        parse401ErrorCode(
          JSON.stringify({ success: false, error: "GOOGLE_RECONNECT_REQUIRED" }),
          "application/json"
        )
      ).toBe("GOOGLE_RECONNECT_REQUIRED");
    });

    it("returns undefined for non-JSON content type", () => {
      expect(parse401ErrorCode("GOOGLE_RECONNECT_REQUIRED", "text/plain")).toBeUndefined();
    });

    it("returns undefined for invalid JSON", () => {
      expect(parse401ErrorCode("{not json", "application/json")).toBeUndefined();
    });

    it("returns undefined when error field is missing", () => {
      expect(
        parse401ErrorCode(JSON.stringify({ success: false, message: "oops" }), "application/json")
      ).toBeUndefined();
    });
  });
});
