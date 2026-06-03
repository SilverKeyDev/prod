import { describe, expect, it } from "vitest";

import { AuthenticationError, HttpError } from "packages/services/http/client/errors";

import { getErrorCatalogI18nKeys, lookupErrorCatalogEntry } from "./errorCatalog";
import {
  looksLikeMachineErrorCode,
  resolveApiResultErrorMessage,
  resolveUserFacingMessage,
} from "./resolveUserFacingMessage";

describe("looksLikeMachineErrorCode", () => {
  it("identifies machine codes", () => {
    expect(looksLikeMachineErrorCode("INVALID_CREDENTIALS")).toBe(true);
    expect(looksLikeMachineErrorCode("validation_error")).toBe(true);
    expect(looksLikeMachineErrorCode("REFRESH_TOKEN_EXPIRED")).toBe(true);
  });

  it("allows human prose", () => {
    expect(looksLikeMachineErrorCode("Super admin access required")).toBe(false);
    expect(looksLikeMachineErrorCode("Please check your input")).toBe(false);
  });
});

describe("resolveUserFacingMessage", () => {
  it("prefers message over error code", () => {
    expect(
      resolveUserFacingMessage({
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Wrong password",
      })
    ).toBe("Wrong password");
  });

  it("maps known error codes via catalog fallback", () => {
    expect(
      resolveUserFacingMessage({
        success: false,
        error: "validation_error",
      })
    ).toBe("Invalid input provided");
  });

  it("shows legacy human text in error field when not a machine code", () => {
    expect(
      resolveUserFacingMessage({
        success: false,
        error: "Super admin access required",
      })
    ).toBe("Super admin access required");
  });

  it("returns generic fallback for unknown machine codes", () => {
    expect(
      resolveUserFacingMessage({
        success: false,
        error: "INTERNAL_THING",
      })
    ).toBe("Something went wrong. Please try again later.");
  });

  it("uses custom fallback when provided", () => {
    expect(
      resolveUserFacingMessage(
        { success: false, error: "UNKNOWN_CODE" },
        { fallbackMessage: "Signup failed" }
      )
    ).toBe("Signup failed");
  });

  it("uses translate when provided for catalog keys", () => {
    const t = (key: string) => (key === "errors.invalid_credentials" ? "Bad login" : key);
    expect(
      resolveUserFacingMessage({ success: false, error: "INVALID_CREDENTIALS" }, { translate: t })
    ).toBe("Bad login");
  });

  it("parses HttpError parsedBody message", () => {
    const err = new HttpError(400, "/api/test", "{}", {
      success: false,
      error: "validation_error",
      message: "Email is required",
    });
    expect(resolveUserFacingMessage(err)).toBe("Email is required");
  });

  it("prefers field_errors when message is absent", () => {
    expect(
      resolveUserFacingMessage({
        success: false,
        error: "validation_error",
        field_errors: { Password: "This field is required" },
      })
    ).toBe("This field is required");
  });

  it("supports deprecated validation_errors array for one release", () => {
    expect(
      resolveUserFacingMessage({
        success: false,
        error: "validation_error",
        validation_errors: ["File type image/heic not allowed"],
      })
    ).toBe("File type image/heic not allowed");
  });

  it("parses AuthenticationError with catalog", () => {
    const err = new AuthenticationError("REFRESH_TOKEN_EXPIRED", "Authentication error", 401);
    expect(resolveUserFacingMessage(err)).toBe("Your session has expired. Please log in again.");
  });
});

describe("resolveApiResultErrorMessage", () => {
  it("delegates to resolver with fallback", () => {
    expect(
      resolveApiResultErrorMessage({ success: false, error: "server_error" }, "Failed to load")
    ).toBe("An error occurred processing your request");
  });
});

describe("error catalog coverage", () => {
  it("every catalog i18n key is unique", () => {
    const keys = getErrorCatalogI18nKeys();
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("lookup is case-insensitive for known codes", () => {
    expect(lookupErrorCatalogEntry("invalid_credentials")?.fallbackEn).toContain("incorrect");
    expect(lookupErrorCatalogEntry("INVALID_CREDENTIALS")?.fallbackEn).toContain("incorrect");
  });
});
