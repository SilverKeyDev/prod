import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "packages/features/homeauth/api/auth";

import { useAuthVerification } from "./useAuthVerification";

vi.mock("packages/features/homeauth/api/auth");
vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    security: vi.fn(),
  },
  LOG_CATEGORIES: {
    AUTH: "auth",
    SECURITY: "security",
  },
}));

describe("useAuthVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verify forwards to authApi.verify with email, code, and password", async () => {
    vi.mocked(authApi.verify).mockResolvedValue({ success: true } as never);
    const { result } = renderHook(() => useAuthVerification());

    await result.current.verify("user@example.com", "123456", "secret-pass");

    expect(authApi.verify).toHaveBeenCalledWith(
      "user@example.com",
      "123456",
      "secret-pass",
    );
  });

  it("resendCode forwards to authApi.resendCode", async () => {
    vi.mocked(authApi.resendCode).mockResolvedValue({ success: true } as never);
    const { result } = renderHook(() => useAuthVerification());

    await result.current.resendCode("user@example.com");

    expect(authApi.resendCode).toHaveBeenCalledWith("user@example.com");
  });
});
