import { describe, expect, it } from "vitest";

import { requireApiSuccessData, throwUnlessApiSuccess } from "./apiRouteResponse";

describe("throwUnlessApiSuccess", () => {
  it("does not throw when success is true", () => {
    expect(() => throwUnlessApiSuccess({ success: true }, "fallback")).not.toThrow();
  });

  it("prefers message over error code when success is false", () => {
    expect(() =>
      throwUnlessApiSuccess(
        { success: false, error: "validation_error", message: "Email is required" },
        "fallback"
      )
    ).toThrow("Email is required");
  });

  it("maps error code when message is absent", () => {
    expect(() =>
      throwUnlessApiSuccess({ success: false, error: "validation_error" }, "fallback")
    ).toThrow("Invalid input provided");
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

  it("prefers message over error code when success is false", () => {
    expect(() =>
      requireApiSuccessData(
        { success: false, error: "server_error", message: "Try again later", data: null },
        "fallback"
      )
    ).toThrow("Try again later");
  });

  it("throws with fallback when data is missing", () => {
    expect(() => requireApiSuccessData({ success: true, data: null }, "fallback")).toThrow(
      "fallback"
    );
  });
});
