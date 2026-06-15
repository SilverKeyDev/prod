import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isChunkLoadError,
  STALE_DEPLOY_CHUNK_RELOAD_KEY,
} from "packages/utils/core/errorHandling/chunkLoadRecovery";

const sessionStore = new Map<string, string>();
const reloadMock = vi.fn();

vi.mock("packages/utils/core/storage/platformStorage", () => ({
  getSessionStorage: () => ({
    getItem: (key: string) => sessionStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      sessionStore.set(key, value);
    },
    removeItem: (key: string) => {
      sessionStore.delete(key);
    },
    clear: () => {
      sessionStore.clear();
    },
  }),
}));

vi.mock("packages/utils/core/platform", async (importOriginal) => {
  const actual = await importOriginal<typeof import("packages/utils/core/platform")>();
  return {
    ...actual,
    getWindow: () =>
      ({
        location: { reload: reloadMock },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as Window,
  };
});

describe("isChunkLoadError", () => {
  it("detects Vite dynamic import failure messages", () => {
    expect(
      isChunkLoadError(
        new TypeError(
          "Failed to fetch dynamically imported module: https://usesilverkey.com/assets/LibraryPage-B6oA6pPZ.js"
        )
      )
    ).toBe(true);
  });

  it("detects Safari-style module import failures", () => {
    expect(isChunkLoadError(new Error("Importing a module script failed."))).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isChunkLoadError(new Error("Network request failed"))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });
});

describe("tryRecoverFromStaleDeployChunk", () => {
  beforeEach(() => {
    sessionStore.clear();
    reloadMock.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    sessionStore.clear();
    vi.unstubAllGlobals();
  });

  it("does not reload in development", async () => {
    vi.doMock("packages/config/env", () => ({
      getEnv: () => ({ isProduction: false }),
    }));

    const { tryRecoverFromStaleDeployChunk } =
      await import("packages/utils/core/errorHandling/chunkLoadRecovery");
    const error = new TypeError("Failed to fetch dynamically imported module: /assets/Foo.js");

    expect(tryRecoverFromStaleDeployChunk(error)).toBe(false);
    expect(reloadMock).not.toHaveBeenCalled();
  });

  it("reloads once in production for chunk errors", async () => {
    vi.doMock("packages/config/env", () => ({
      getEnv: () => ({ isProduction: true }),
    }));

    const { tryRecoverFromStaleDeployChunk } =
      await import("packages/utils/core/errorHandling/chunkLoadRecovery");
    const error = new TypeError("Failed to fetch dynamically imported module: /assets/Foo.js");

    expect(tryRecoverFromStaleDeployChunk(error)).toBe(true);
    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(sessionStore.get(STALE_DEPLOY_CHUNK_RELOAD_KEY)).toBe("1");

    expect(tryRecoverFromStaleDeployChunk(error)).toBe(false);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
