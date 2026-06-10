import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.hoisted(() => vi.fn());
const recoverSessionAfter401Mock = vi.hoisted(() => vi.fn());
const isAuthEndpointMock = vi.hoisted(() => vi.fn());

vi.mock("packages/logger", () => ({
  API_SUBCATEGORIES: {
    POLLING: "POLLING",
  },
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
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
    location: {
      host: "app.test",
      origin: "http://app.test",
    },
  }),
}));

vi.mock("./auth/authErrorNotify", () => ({
  notifyAuthenticationError: vi.fn(),
}));

vi.mock("./auth/authRecovery", () => ({
  isAuthEndpoint: isAuthEndpointMock,
  recoverSessionAfter401: recoverSessionAfter401Mock,
}));

import { HttpClient } from "./HttpClient";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });
}

describe("HttpClient 401 session recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAuthEndpointMock.mockImplementation((url: string) => url.includes("/api/v1/auth/"));
    recoverSessionAfter401Mock.mockResolvedValue(true);
  });

  it("recovers a non-auth 401 and retries the original request once", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: "ACCESS_TOKEN_EXPIRED" }, 401))
      .mockResolvedValueOnce(jsonResponse({ success: true, value: "recovered" }));

    const client = new HttpClient({ baseUrl: "http://api.test", retries: 0 });

    await expect(client.get("/api/v1/search/homes")).resolves.toEqual({
      success: true,
      value: "recovered",
    });

    expect(recoverSessionAfter401Mock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://api.test/api/v1/search/homes");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://api.test/api/v1/search/homes");
  });

  it("does not retry when 401 recovery fails", async () => {
    recoverSessionAfter401Mock.mockResolvedValue(false);
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "ACCESS_TOKEN_EXPIRED", message: "Session expired" }, 401)
    );

    const client = new HttpClient({ baseUrl: "http://api.test", retries: 0 });

    await expect(client.get("/api/v1/search/homes")).rejects.toMatchObject({
      name: "AuthenticationError",
      status: 401,
    });
    expect(recoverSessionAfter401Mock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not recover or retry auth endpoint 401 responses", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "REFRESH_TOKEN_INVALID", message: "Refresh failed" }, 401)
    );

    const client = new HttpClient({ baseUrl: "http://api.test", retries: 0 });

    await expect(client.get("/api/v1/auth/refresh-token")).rejects.toMatchObject({
      name: "HttpError",
      status: 401,
    });
    expect(recoverSessionAfter401Mock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not recover or retry when the request signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "ACCESS_TOKEN_EXPIRED", message: "Session expired" }, 401)
    );

    const client = new HttpClient({ baseUrl: "http://api.test", retries: 0 });

    await expect(
      client.get("/api/v1/search/homes", { signal: controller.signal })
    ).rejects.toMatchObject({
      name: "AuthenticationError",
      status: 401,
    });
    expect(recoverSessionAfter401Mock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
