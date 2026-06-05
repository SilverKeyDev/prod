import { describe, expect, it } from "vitest";

import { validateSchedulingFormInput } from "./schedulingFormValidation";

describe("validateSchedulingFormInput", () => {
  it("requires a selected slot", () => {
    expect(validateSchedulingFormInput("t", "", false)).toEqual({
      ok: false,
      message: "Select a time slot before scheduling.",
    });
  });

  it("rejects oversized title", () => {
    expect(validateSchedulingFormInput("x".repeat(201), "", true).ok).toBe(false);
  });

  it("accepts valid input", () => {
    expect(validateSchedulingFormInput("Meeting", "Notes", true)).toEqual({ ok: true });
  });
});
