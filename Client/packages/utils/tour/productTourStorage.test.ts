import { beforeEach, describe, expect, it } from "vitest";
import type { StateStorage } from "zustand/middleware";

import type { KeyValueStorage } from "packages/utils/storage/platformStorage";
import { getLocalStorage, setPlatformStorage } from "packages/utils/storage/platformStorage";

import {
  hasIncompleteSearchProductTourSteps,
  isProductTourCompleted,
  isSearchProductTourStepCompleted,
  markProductTourCompleted,
  markSearchProductTourStepCompleted,
} from "./productTourStorage";
import { productTourStorageKey, searchProductTourStepStorageKey } from "./tourSchema";

const SAMPLE_STEP = "search.desktop.preferences";

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
    expect(searchProductTourStepStorageKey(SAMPLE_STEP)).toMatch(
      /silverkey\.productTour\.v\d+\.step\.search\.desktop\.preferences/
    );
  });

  it("round-trips legacy completed flag", () => {
    expect(isProductTourCompleted()).toBe(false);
    markProductTourCompleted();
    expect(getLocalStorage().getItem(productTourStorageKey())).toBe("1");
    expect(isProductTourCompleted()).toBe(true);
    expect(isSearchProductTourStepCompleted(SAMPLE_STEP)).toBe(true);
    expect(hasIncompleteSearchProductTourSteps("desktop")).toBe(false);
  });

  it("tracks each spotlight independently and sets legacy after both desktop steps", () => {
    const d1 = "search.desktop.preferences";
    const d2 = "search.desktop.display";
    expect(isSearchProductTourStepCompleted(d1)).toBe(false);
    markSearchProductTourStepCompleted(d1);
    expect(isSearchProductTourStepCompleted(d1)).toBe(true);
    expect(isProductTourCompleted()).toBe(false);
    expect(hasIncompleteSearchProductTourSteps("desktop")).toBe(true);
    markSearchProductTourStepCompleted(d2);
    expect(isProductTourCompleted()).toBe(true);
    expect(hasIncompleteSearchProductTourSteps("desktop")).toBe(false);
  });
});
