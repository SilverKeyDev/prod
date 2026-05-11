import { describe, expect, it } from "vitest";

import { requireApiSuccessData, throwUnlessApiSuccess } from "./apiRouteResponse";

describe("throwUnlessApiSuccess", () => {
  it("does not throw when success is true", () => {
    expect(() => throwUnlessApiSuccess({ success: true }, "fallback")).not.toThrow();
  });

  it("throws with response.error when success is false and error is set", () => {
    expect(() => throwUnlessApiSuccess({ success: false, error: "boom" }, "fallback")).toThrow(
      "boom"
    );
  });

  it("throws with fallback when success is false and error is empty", () => {
    expect(() => throwUnlessApiSuccess({ success: false }, "fallback")).toThrow("fallback");
    expect(() => throwUnlessApiSuccess({ success: false, error: "" }, "fallback")).toThrow(
      "fallback"
    );
  });
});

describe("requireApiSuccessData", () => {
  it("returns data when success and data are present", () => {
    expect(requireApiSuccessData({ success: true, data: 42 }, "fallback")).toBe(42);
  });

  it("throws with response.error when success is false", () => {
    expect(() =>
      requireApiSuccessData({ success: false, error: "nope", data: null }, "fallback")
    ).toThrow("nope");
  });

  it("throws with fallback when data is missing", () => {
    expect(() => requireApiSuccessData({ success: true, data: null }, "fallback")).toThrow(
      "fallback"
    );
  });
});
