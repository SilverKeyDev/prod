import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { broadcastAuthLogout } from "./authBroadcast";
import { postRefreshTokenWithRetry } from "./refreshTokenRetry";

vi.mock("packages/config/env", () => ({
  getEnv: () => ({ apiBaseUrl: "http://api.test" }),
  getBaseUrl: () => "http://api.test",
  getDefaultTimeout: () => 30_000,
  getDefaultRetries: () => 3,
}));

vi.mock("packages/utils/core/platform", () => ({
  getFetch: () => globalThis.fetch,
}));

vi.mock("./authBroadcast", () => ({
  broadcastAuthLogout: vi.fn(),
  getAuthBC: vi.fn(() => null),
}));

describe("postRefreshTokenWithRetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retries on 503 with retryable body then succeeds without broadcasting logout", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: false, retryable: true }), { status: 503 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, user: { id: "u1" } }), { status: 200 })
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await postRefreshTokenWithRetry(3, "test-retry");

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(broadcastAuthLogout).not.toHaveBeenCalled();
  });

  it("does not treat final non-retryable failure as success", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, error: "REFRESH_TOKEN_INVALID" }), {
        status: 401,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await postRefreshTokenWithRetry(3, "test-fail");

    expect(result.success).toBe(false);
    expect(result.retryable).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
