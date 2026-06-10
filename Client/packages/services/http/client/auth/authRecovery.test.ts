import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.hoisted(() => vi.fn());
const dispatchEventMock = vi.hoisted(() => vi.fn());
const broadcastAuthLogoutMock = vi.hoisted(() => vi.fn());
const postRefreshTokenWithRetryMock = vi.hoisted(() => vi.fn());

vi.mock("packages/config/env", () => ({
  getEnv: () => ({ apiBaseUrl: "http://api.test" }),
}));

vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("packages/services/http/client/request/requestId", () => ({
  createHttpRequestId: () => "request-1",
}));

vi.mock("packages/utils/core/platform", () => ({
  getFetch: () => fetchMock,
  getWindow: () => ({ dispatchEvent: dispatchEventMock }),
}));

vi.mock("./authBroadcast", () => ({
  broadcastAuthLogout: broadcastAuthLogoutMock,
}));

vi.mock("./refreshTokenRetry", () => ({
  postRefreshTokenWithRetry: postRefreshTokenWithRetryMock,
}));

import { isAuthEndpoint, recoverSessionAfter401 } from "./authRecovery";

const successfulRefresh = {
  body: { success: true },
  ok: true,
  retryable: false,
  status: 200,
  success: true,
};

describe("authRecovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        headers: { "content-type": "application/json" },
        status: 200,
      })
    );
    postRefreshTokenWithRetryMock.mockResolvedValue(successfulRefresh);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recognizes auth endpoints that must not trigger recovery retries", () => {
    expect(isAuthEndpoint("http://api.test/api/v1/auth/refresh-token")).toBe(true);
    expect(isAuthEndpoint("http://api.test/api/v1/auth/login")).toBe(true);
    expect(isAuthEndpoint("http://api.test/api/v1/user/profile")).toBe(true);
    expect(isAuthEndpoint("http://api.test/api/v1/search/homes")).toBe(false);
  });

  it("returns true after refresh and profile verification succeed", async () => {
    await expect(recoverSessionAfter401()).resolves.toBe(true);

    expect(postRefreshTokenWithRetryMock).toHaveBeenCalledWith(3, "request-1");
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/api/v1/user/profile", {
      credentials: "include",
      headers: { "X-Request-ID": "request-1" },
      method: "GET",
    });
    expect(broadcastAuthLogoutMock).not.toHaveBeenCalled();
    expect(dispatchEventMock).not.toHaveBeenCalled();
  });

  it("broadcasts logout and authenticationError when refresh fails", async () => {
    postRefreshTokenWithRetryMock.mockResolvedValue({
      body: { error: "REFRESH_TOKEN_INVALID" },
      ok: false,
      retryable: false,
      status: 401,
      success: false,
    });

    await expect(recoverSessionAfter401()).resolves.toBe(false);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(broadcastAuthLogoutMock).toHaveBeenCalledTimes(1);
    expect(dispatchEventMock).toHaveBeenCalledTimes(1);
    expect((dispatchEventMock.mock.calls[0]?.[0] as Event).type).toBe("authenticationError");
  });

  it("broadcasts logout when profile verification fails after refresh", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: false }), {
        headers: { "content-type": "application/json" },
        status: 200,
      })
    );

    await expect(recoverSessionAfter401()).resolves.toBe(false);

    expect(postRefreshTokenWithRetryMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(broadcastAuthLogoutMock).toHaveBeenCalledTimes(1);
    expect(dispatchEventMock).toHaveBeenCalledTimes(1);
  });

  it("dedupes concurrent recovery attempts behind one refresh chain", async () => {
    let resolveRefresh!: (value: typeof successfulRefresh) => void;
    postRefreshTokenWithRetryMock.mockImplementation(
      () =>
        new Promise<typeof successfulRefresh>((resolve) => {
          resolveRefresh = resolve;
        })
    );

    const firstRecovery = recoverSessionAfter401();
    const secondRecovery = recoverSessionAfter401();

    expect(postRefreshTokenWithRetryMock).toHaveBeenCalledTimes(1);

    resolveRefresh(successfulRefresh);

    await expect(Promise.all([firstRecovery, secondRecovery])).resolves.toEqual([true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(broadcastAuthLogoutMock).not.toHaveBeenCalled();
  });
});
