/**
 * Session stability regression suite.
 *
 * Invariant: a valid SilverKey session must not be torn down because a third-party
 * integration returned a non-session 401 (e.g. GOOGLE_RECONNECT_REQUIRED).
 *
 * Uses the real HttpClient → recoverSessionAfter401 → responseHandler stack.
 * Only I/O boundaries are mocked (fetch, refresh, logout side effects).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.hoisted(() => vi.fn());
const postRefreshTokenWithRetryMock = vi.hoisted(() => vi.fn());
const broadcastAuthLogoutMock = vi.hoisted(() => vi.fn());
const notifyAuthenticationErrorMock = vi.hoisted(() => vi.fn());
const dispatchEventMock = vi.hoisted(() => vi.fn());

vi.mock("packages/config/env", () => ({
  getEnv: () => ({ apiBaseUrl: "http://api.test" }),
}));

vi.mock("packages/logger", () => ({
  API_SUBCATEGORIES: {
    POLLING: "POLLING",
  },
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    security: vi.fn(),
  },
}));

vi.mock("packages/services/analytics/posthogHeaders", () => ({
  getPostHogRequestHeaders: () => ({}),
}));

vi.mock("packages/services/http/client/request/requestId", () => ({
  createHttpRequestId: () => "request-1",
}));

vi.mock("packages/utils/core/platform", () => ({
  getDocument: () => ({
    cookie: "sid=present",
    querySelector: vi.fn(() => null),
  }),
  getFetch: () => fetchMock,
  getWindow: () => ({
    dispatchEvent: dispatchEventMock,
    location: {
      host: "app.test",
      origin: "http://app.test",
    },
  }),
}));

vi.mock("./auth/authErrorNotify", () => ({
  notifyAuthenticationError: notifyAuthenticationErrorMock,
}));

vi.mock("./auth/authBroadcast", () => ({
  broadcastAuthLogout: broadcastAuthLogoutMock,
}));

vi.mock("./auth/refreshTokenRetry", () => ({
  postRefreshTokenWithRetry: postRefreshTokenWithRetryMock,
}));

import { HttpError } from "./errors";
import { HttpClient } from "./HttpClient";

const successfulRefresh = {
  body: { success: true },
  ok: true,
  retryable: false,
  status: 200,
  success: true,
};

const profileSuccess = { success: true, data: { id: "user-1", email: "agent@test.com" } };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });
}

function googleReconnect401(): Response {
  return jsonResponse(
    {
      success: false,
      error: "GOOGLE_RECONNECT_REQUIRED",
      message: "Google Calendar reconnection required.",
    },
    401
  );
}

function assertNoGlobalLogout(): void {
  expect(broadcastAuthLogoutMock).not.toHaveBeenCalled();
  expect(notifyAuthenticationErrorMock).not.toHaveBeenCalled();
  expect(dispatchEventMock).not.toHaveBeenCalled();
}

describe("HttpClient session stability", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    postRefreshTokenWithRetryMock.mockReset();
    broadcastAuthLogoutMock.mockClear();
    notifyAuthenticationErrorMock.mockClear();
    dispatchEventMock.mockClear();
    postRefreshTokenWithRetryMock.mockResolvedValue(successfulRefresh);
  });

  it("does not attempt session recovery or logout for integration 401 even when refresh would fail", async () => {
    postRefreshTokenWithRetryMock.mockResolvedValue({
      body: { error: "REFRESH_TOKEN_INVALID" },
      ok: false,
      retryable: false,
      status: 401,
      success: false,
    });
    fetchMock.mockResolvedValueOnce(googleReconnect401());

    const client = new HttpClient({ baseUrl: "http://api.test", retries: 0 });

    await expect(client.get("/api/v1/google/me/silverkey-calendar")).rejects.toBeInstanceOf(
      HttpError
    );

    expect(postRefreshTokenWithRetryMock).not.toHaveBeenCalled();
    assertNoGlobalLogout();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps session when profile succeeds and google calendar returns GOOGLE_RECONNECT_REQUIRED in parallel", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/api/v1/user/profile")) {
        return Promise.resolve(jsonResponse(profileSuccess));
      }
      if (url.includes("/api/v1/google/me/silverkey-calendar")) {
        return Promise.resolve(googleReconnect401());
      }
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });

    const client = new HttpClient({ baseUrl: "http://api.test", retries: 0 });

    const [profileResult, googleError] = await Promise.all([
      client.get<typeof profileSuccess>("/api/v1/user/profile"),
      client.get("/api/v1/google/me/silverkey-calendar").catch((error: unknown) => error),
    ]);

    expect(profileResult).toEqual(profileSuccess);
    expect(googleError).toBeInstanceOf(HttpError);
    assertNoGlobalLogout();
    expect(postRefreshTokenWithRetryMock).not.toHaveBeenCalled();
  });

  it("keeps session when google 401 resolves before profile (order independence)", async () => {
    let profileDelayResolve!: (value: Response) => void;
    const profileDelayed = new Promise<Response>((resolve) => {
      profileDelayResolve = resolve;
    });

    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/api/v1/google/me/silverkey-calendar")) {
        return Promise.resolve(googleReconnect401());
      }
      if (url.includes("/api/v1/user/profile")) {
        return profileDelayed;
      }
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });

    const client = new HttpClient({ baseUrl: "http://api.test", retries: 0 });

    const googlePromise = client
      .get("/api/v1/google/me/silverkey-calendar")
      .catch((error: unknown) => error);
    const profilePromise = client.get<typeof profileSuccess>("/api/v1/user/profile");

    const googleError = await googlePromise;
    expect(googleError).toBeInstanceOf(HttpError);
    assertNoGlobalLogout();

    profileDelayResolve(jsonResponse(profileSuccess));
    await expect(profilePromise).resolves.toEqual(profileSuccess);
    assertNoGlobalLogout();
    expect(postRefreshTokenWithRetryMock).not.toHaveBeenCalled();
  });

  it("runs one recovery chain for session 401 while integration 401 stays local", async () => {
    let homesCallCount = 0;

    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/api/v1/search/homes")) {
        homesCallCount += 1;
        if (homesCallCount === 1) {
          return Promise.resolve(jsonResponse({ error: "TOKEN_EXPIRED", message: "expired" }, 401));
        }
        return Promise.resolve(jsonResponse({ success: true, value: "homes" }));
      }
      if (url.includes("/api/v1/google/me/silverkey-calendar")) {
        return Promise.resolve(googleReconnect401());
      }
      if (url.includes("/api/v1/user/profile")) {
        return Promise.resolve(jsonResponse({ success: true }));
      }
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });

    const client = new HttpClient({ baseUrl: "http://api.test", retries: 0 });

    const [homesResult, googleError] = await Promise.all([
      client.get<{ success: true; value: string }>("/api/v1/search/homes"),
      client.get("/api/v1/google/me/silverkey-calendar").catch((error: unknown) => error),
    ]);

    expect(homesResult).toEqual({ success: true, value: "homes" });
    expect(googleError).toBeInstanceOf(HttpError);
    expect(postRefreshTokenWithRetryMock).toHaveBeenCalledTimes(1);
    assertNoGlobalLogout();
  });

  it("does not start a second recovery when integration 401 arrives during in-flight session recovery", async () => {
    let resolveRefresh!: (value: typeof successfulRefresh) => void;
    postRefreshTokenWithRetryMock.mockImplementation(
      () =>
        new Promise<typeof successfulRefresh>((resolve) => {
          resolveRefresh = resolve;
        })
    );

    let homesCallCount = 0;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/api/v1/search/homes")) {
        homesCallCount += 1;
        if (homesCallCount === 1) {
          return Promise.resolve(jsonResponse({ error: "TOKEN_EXPIRED" }, 401));
        }
        return Promise.resolve(jsonResponse({ success: true, value: "homes" }));
      }
      if (url.includes("/api/v1/google/me/silverkey-calendar")) {
        return Promise.resolve(googleReconnect401());
      }
      if (url.includes("/api/v1/user/profile")) {
        return Promise.resolve(jsonResponse({ success: true }));
      }
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });

    const client = new HttpClient({ baseUrl: "http://api.test", retries: 0 });

    const homesPromise = client.get("/api/v1/search/homes");
    const googlePromise = client
      .get("/api/v1/google/me/silverkey-calendar")
      .catch((error: unknown) => error);

    await vi.waitFor(() => {
      expect(postRefreshTokenWithRetryMock).toHaveBeenCalledTimes(1);
    });

    const googleError = await googlePromise;
    expect(googleError).toBeInstanceOf(HttpError);
    expect(postRefreshTokenWithRetryMock).toHaveBeenCalledTimes(1);
    assertNoGlobalLogout();

    resolveRefresh(successfulRefresh);
    await expect(homesPromise).resolves.toEqual({ success: true, value: "homes" });
    assertNoGlobalLogout();
  });

  it("still broadcasts logout when a true session 401 recovery fails", async () => {
    postRefreshTokenWithRetryMock.mockResolvedValue({
      body: { error: "REFRESH_TOKEN_INVALID" },
      ok: false,
      retryable: false,
      status: 401,
      success: false,
    });
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "TOKEN_EXPIRED", message: "Session expired" }, 401)
    );

    const client = new HttpClient({ baseUrl: "http://api.test", retries: 0 });

    await expect(client.get("/api/v1/search/homes")).rejects.toMatchObject({
      name: "AuthenticationError",
      status: 401,
    });

    expect(postRefreshTokenWithRetryMock).toHaveBeenCalledTimes(1);
    expect(broadcastAuthLogoutMock).toHaveBeenCalledTimes(1);
    expect(dispatchEventMock).toHaveBeenCalledTimes(1);
    expect(notifyAuthenticationErrorMock).toHaveBeenCalledTimes(1);
  });
});
