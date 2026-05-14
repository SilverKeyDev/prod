import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { performVerify } from "./performVerify";

vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
  },
  LOG_CATEGORIES: { AUTH: "AUTH" },
}));

describe("performVerify", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws when email or stored password is missing", async () => {
    await expect(
      performVerify(vi.fn(), "", "123456", () => null, vi.fn(), vi.fn())
    ).rejects.toThrow(/sign up again/i);
  });

  it("throws when verify returns success false", async () => {
    const verify = vi.fn().mockResolvedValue({
      success: false,
      error: "Bad code",
    });
    await expect(
      performVerify(verify, "u@example.com", "123456", () => "secret", vi.fn(), vi.fn())
    ).rejects.toThrow("Bad code");
    expect(verify).toHaveBeenCalledWith("u@example.com", "123456", "secret");
  });

  it("clears storage and schedules navigate on success", async () => {
    const verify = vi.fn().mockResolvedValue({ success: true });
    const clearSignupStorage = vi.fn();
    const navigate = vi.fn();
    await performVerify(
      verify,
      "u@example.com",
      "123456",
      () => "pw",
      clearSignupStorage,
      navigate,
      { postSuccessPath: "/dashboard" }
    );
    expect(clearSignupStorage).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(navigate).toHaveBeenCalledWith("/dashboard");
  });
});
