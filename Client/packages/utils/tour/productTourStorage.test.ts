import { beforeEach, describe, expect, it } from "vitest";
import type { StateStorage } from "zustand/middleware";

import type { KeyValueStorage } from "packages/utils/storage/platformStorage";
import { getLocalStorage, setPlatformStorage } from "packages/utils/storage/platformStorage";

import { isProductTourCompleted, markProductTourCompleted } from "./productTourStorage";
import { productTourStorageKey } from "./tourSchema";

function createMemoryLocal(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
  };
}

function createMemoryPersistStorage(): StateStorage {
  const map = new Map<string, string>();
  return {
    getItem: (name: string) => map.get(name) ?? null,
    setItem: (name: string, value: string) => {
      map.set(name, value);
    },
    removeItem: (name: string) => {
      map.delete(name);
    },
  };
}

describe("productTourStorage", () => {
  beforeEach(() => {
    const local = createMemoryLocal();
    setPlatformStorage({
      local,
      session: createMemoryLocal(),
      persistStorage: createMemoryPersistStorage(),
    });
    local.clear();
  });

  it("uses a versioned storage key", () => {
    expect(productTourStorageKey()).toMatch(/silverkey\.productTour\.v\d+\.completed/);
  });

  it("round-trips completed flag", () => {
    expect(isProductTourCompleted()).toBe(false);
    markProductTourCompleted();
    expect(getLocalStorage().getItem(productTourStorageKey())).toBe("1");
    expect(isProductTourCompleted()).toBe(true);
  });
});
