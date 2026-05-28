import { describe, expect, it } from "vitest";

import { HttpError } from "packages/services/http/client";

import { getPartnerLogoUploadErrorMessage } from "./partnersLogoUploadError";

describe("getPartnerLogoUploadErrorMessage", () => {
  it("reads additional_info.message from HttpError body", () => {
    const err = new HttpError(400, "/logo", "", {
      success: false,
      additional_info: { message: "File type image/heic not allowed" },
    });
    expect(getPartnerLogoUploadErrorMessage(err, "fallback")).toBe(
      "File type image/heic not allowed"
    );
  });

  it("falls back when body has no detail", () => {
    expect(getPartnerLogoUploadErrorMessage(new Error("HTTP 400"), "fallback")).toBe("fallback");
  });
});
