import { beforeEach, describe, expect, it } from "vitest";
import type { StateStorage } from "zustand/middleware";

import type { KeyValueStorage } from "packages/utils/core/storage/platformStorage";
import { setPlatformStorage } from "packages/utils/core/storage/platformStorage";

import {
  hasIncompleteSearchProductTourSteps,
  isSearchProductTourStepCompleted,
  markSearchProductTourStepCompleted,
} from "./productTourStorage";
import { searchProductTourStepStorageKey } from "./tourSchema";

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

  it("uses a versioned per-step storage key", () => {
    expect(searchProductTourStepStorageKey(SAMPLE_STEP)).toMatch(
      /silverkey\.productTour\.v\d+\.step\.search\.desktop\.preferences/
    );
  });

  it("marks desktop tour complete when the preferences step is done", () => {
    const preferencesStep = "search.desktop.preferences";
    expect(isSearchProductTourStepCompleted(preferencesStep)).toBe(false);
    expect(hasIncompleteSearchProductTourSteps("desktop")).toBe(true);
    markSearchProductTourStepCompleted(preferencesStep);
    expect(isSearchProductTourStepCompleted(preferencesStep)).toBe(true);
    expect(hasIncompleteSearchProductTourSteps("desktop")).toBe(false);
  });
});
