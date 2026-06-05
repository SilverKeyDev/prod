import { afterEach, describe, expect, it, vi } from "vitest";

import * as platform from "packages/utils/core/platform";

import { tryWebShare } from "./webShare";

describe("tryWebShare", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns unavailable when share is missing", async () => {
    vi.spyOn(platform, "getNavigator").mockReturnValue({} as Navigator);
    await expect(
      tryWebShare({ title: "T", text: "x", url: "https://example.com/p" })
    ).resolves.toBe("unavailable");
  });

  it("returns shared when share resolves", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(platform, "getNavigator").mockReturnValue({ share } as unknown as Navigator);
    const payload = { title: "Homes", text: "Hello", url: "https://example.com/x" };
    await expect(tryWebShare(payload)).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith(payload);
  });

  it("returns aborted on AbortError", async () => {
    const abort = new Error("cancelled");
    abort.name = "AbortError";
    const share = vi.fn().mockRejectedValue(abort);
    vi.spyOn(platform, "getNavigator").mockReturnValue({ share } as unknown as Navigator);
    await expect(tryWebShare({ url: "https://example.com/p" })).resolves.toBe("aborted");
  });
});
