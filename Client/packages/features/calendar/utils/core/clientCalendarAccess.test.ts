import { describe, expect, it } from "vitest";

import {
  CLIENT_CALENDAR_PERMISSION_ERROR,
  ClientCalendarAccessError,
  isClientCalendarAccessError,
  parseClientCalendarFailure,
} from "./clientCalendarAccess";

describe("clientCalendarAccess", () => {
  describe("parseClientCalendarFailure", () => {
    it("returns ClientCalendarAccessError when client has not connected", () => {
      const error = parseClientCalendarFailure({
        error: CLIENT_CALENDAR_PERMISSION_ERROR,
        message: "Custom not connected message",
        client_has_connection: false,
      });

      expect(error).toBeInstanceOf(ClientCalendarAccessError);
      expect((error as ClientCalendarAccessError).clientHasConnection).toBe(false);
      expect(error.message).toBe("Custom not connected message");
    });

    it("returns ClientCalendarAccessError when client connected but missing permission", () => {
      const error = parseClientCalendarFailure({
        error: CLIENT_CALENDAR_PERMISSION_ERROR,
        client_has_connection: true,
      });

      expect(error).toBeInstanceOf(ClientCalendarAccessError);
      expect((error as ClientCalendarAccessError).clientHasConnection).toBe(true);
      expect(error.message).toContain("granted full calendar access");
    });

    it("returns generic Error for other API failures", () => {
      const error = parseClientCalendarFailure({
        error: "unauthorized",
        message: "You do not have access",
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(ClientCalendarAccessError);
      expect(error.message).toBe("You do not have access");
    });

    it("uses fallback message when body is empty", () => {
      const error = parseClientCalendarFailure(undefined, "Fallback");
      expect(error.message).toBe("Fallback");
    });
  });

  describe("isClientCalendarAccessError", () => {
    it("narrows ClientCalendarAccessError instances", () => {
      const error = new ClientCalendarAccessError("Blocked", false);
      expect(isClientCalendarAccessError(error)).toBe(true);
      expect(isClientCalendarAccessError(new Error("other"))).toBe(false);
    });
  });
});
