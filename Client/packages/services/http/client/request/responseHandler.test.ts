import { describe, expect, it, vi } from "vitest";

vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("packages/utils/core/platform", () => ({
  getDocument: () => ({
    cookie: "sid=present",
  }),
  getWindow: () => ({
    location: {
      host: "app.test",
      origin: "http://app.test",
    },
  }),
}));

import { AuthenticationError, HttpError } from "../errors";
import { handleHttpResponse } from "./responseHandler";

function callHandler(status: number, body: unknown, url: string): void {
  const responseText = JSON.stringify(body);
  handleHttpResponse(
    new Response(responseText, {
      status,
      headers: { "content-type": "application/json" },
    }),
    responseText,
    "application/json",
    url,
    [],
    {},
    { credentials: "include" },
    "GET"
  );
}

describe("handleHttpResponse integration 401s", () => {
  it("throws HttpError for GOOGLE_RECONNECT_REQUIRED", () => {
    expect(() =>
      callHandler(
        401,
        {
          success: false,
          error: "GOOGLE_RECONNECT_REQUIRED",
          message: "Google Calendar reconnection required.",
        },
        "http://api.test/api/v1/google/me/silverkey-calendar"
      )
    ).toThrow(HttpError);

    expect(() =>
      callHandler(
        401,
        {
          success: false,
          error: "GOOGLE_RECONNECT_REQUIRED",
          message: "Google Calendar reconnection required.",
        },
        "http://api.test/api/v1/google/me/silverkey-calendar"
      )
    ).not.toThrow(AuthenticationError);
  });

  it("throws HttpError for client_permission_required", () => {
    expect(() =>
      callHandler(
        401,
        {
          success: false,
          error: "client_permission_required",
          message: "Client has not granted calendar access.",
        },
        "http://api.test/api/v1/google/me/events"
      )
    ).toThrow(HttpError);

    expect(() =>
      callHandler(
        401,
        {
          success: false,
          error: "client_permission_required",
          message: "Client has not granted calendar access.",
        },
        "http://api.test/api/v1/google/me/events"
      )
    ).not.toThrow(AuthenticationError);
  });

  it("throws AuthenticationError for TOKEN_EXPIRED on non-auth endpoints", () => {
    expect(() =>
      callHandler(
        401,
        {
          success: false,
          error: "TOKEN_EXPIRED",
          message: "Authentication required",
        },
        "http://api.test/api/v1/search/homes"
      )
    ).toThrow(AuthenticationError);
  });

  it("does not treat unknown 401 error codes as session auth failures", () => {
    expect(() =>
      callHandler(
        401,
        {
          success: false,
          error: "SOME_FEATURE_SPECIFIC_CODE",
          message: "Feature-specific failure",
        },
        "http://api.test/api/v1/search/homes"
      )
    ).toThrow(HttpError);
  });
});
