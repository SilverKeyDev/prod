import { afterEach, describe, expect, it, vi } from "vitest";

import * as platform from "packages/utils/platform";

import { tryWebShareUrl } from "./webShareUrl";

describe("tryWebShareUrl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns unavailable when share is missing", async () => {
    vi.spyOn(platform, "getNavigator").mockReturnValue({} as Navigator);
    await expect(
      tryWebShareUrl({ url: "https://example.com/p", title: "T", text: "x" })
    ).resolves.toBe("unavailable");
  });

  it("returns shared when share resolves", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(platform, "getNavigator").mockReturnValue({ share } as unknown as Navigator);
    await expect(tryWebShareUrl({ url: "https://example.com/p" })).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith({ url: "https://example.com/p" });
  });

  it("returns aborted on AbortError", async () => {
    const abort = new Error("cancelled");
    abort.name = "AbortError";
    const share = vi.fn().mockRejectedValue(abort);
    vi.spyOn(platform, "getNavigator").mockReturnValue({ share } as unknown as Navigator);
    await expect(tryWebShareUrl({ url: "https://example.com/p" })).resolves.toBe("aborted");
  });
});
