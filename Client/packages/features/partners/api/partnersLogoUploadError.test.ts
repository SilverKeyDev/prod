import { describe, expect, it } from "vitest";

import { HttpError } from "packages/services/http/client";

import { getPartnerLogoUploadErrorMessage } from "./partnersLogoUploadError";

describe("getPartnerLogoUploadErrorMessage", () => {
  it("reads top-level message from HttpError body", () => {
    const err = new HttpError(400, "/logo", "", {
      success: false,
      message: "File type image/heic not allowed",
    });
    expect(getPartnerLogoUploadErrorMessage(err, "fallback")).toBe(
      "File type image/heic not allowed"
    );
  });

  it("reads field_errors when message is absent", () => {
    const err = new HttpError(400, "/logo", "", {
      success: false,
      error: "validation_error",
      field_errors: { File: "This field is required" },
    });
    expect(getPartnerLogoUploadErrorMessage(err, "fallback")).toBe("This field is required");
  });

  it("falls back when body has no detail", () => {
    expect(getPartnerLogoUploadErrorMessage(new Error("HTTP 400"), "fallback")).toBe("fallback");
  });
});
