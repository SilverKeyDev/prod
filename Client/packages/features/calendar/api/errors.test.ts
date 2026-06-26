import { describe, expect, it } from "vitest";

import { HttpError } from "packages/services/http";

import { wrapGoogleCalendarError } from "./errors";

describe("wrapGoogleCalendarError", () => {
  it("maps GOOGLE_RECONNECT_REQUIRED HttpError to a failure payload", async () => {
    const result = await wrapGoogleCalendarError(async () => {
      throw new HttpError(
        401,
        "http://api.test/api/v1/google/me/silverkey-calendar",
        '{"success":false,"error":"GOOGLE_RECONNECT_REQUIRED","message":"Google Calendar reconnection required."}',
        {
          success: false,
          error: "GOOGLE_RECONNECT_REQUIRED",
          message: "Google Calendar reconnection required.",
        }
      );
    }, "Failed to load SilverKey calendar");

    expect(result).toEqual({
      success: false,
      error: "GOOGLE_RECONNECT_REQUIRED",
      message: "Google Calendar reconnection required.",
      client_has_connection: undefined,
    });
  });
});
